import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { scrapeInformesList } from "../src/lib/scraper/mds-scraper";
import {
  downloadAndParsePdf,
  extractOperationalCalendar,
} from "../src/lib/scraper/pdf-downloader";
import { generateSimplifiedContent, analyzeCrasStatus } from "../src/lib/ai/content-generator";
import { sendInformeNotification } from "../src/lib/notifications/email";
import { db, schema } from "../src/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/**
 * Manual scrape script: Run with `npx tsx scripts/scrape-manual.ts`
 * Useful for initial setup and testing.
 */

async function main() {
  console.log("=== Manual Scrape Started ===\n");

  // Step 1: Scrape informes list
  console.log("[1/5] Scraping MDS website...");
  const informes = await scrapeInformesList();
  console.log(`Found ${informes.length} informes\n`);

  if (informes.length === 0) {
    console.log("No informes found. Check if the website is accessible.");
    return;
  }

  // Show found informes
  informes.slice(0, 10).forEach((inf, i) => {
    console.log(`  ${i + 1}. ${inf.numero}: ${inf.titulo}`);
    console.log(`     URL: ${inf.url}\n`);
  });

  // Step 2: Process the 5 latest informes (skip "Informe 2025" which is a comunicado)
  const latest = informes
    .filter((inf) => {
      const num = parseInt(inf.numero.replace(/\D/g, ""));
      return num <= 200; // Skip weird numbers like "2025"
    })
    .slice(0, 5);
  console.log(`\n[2/5] Processing ${latest.length} latest informes...\n`);

  for (const informe of latest) {
    // Check if already exists
    const existing = db
      .select()
      .from(schema.informes)
      .where(eq(schema.informes.numero, informe.numero))
      .get();

    if (existing) {
      console.log(`  SKIP: ${informe.numero} (already in database)`);
      continue;
    }

    console.log(`  PROCESSING: ${informe.numero}...`);
    const informeId = uuidv4();

    try {
      // Gov.br serves PDFs inline - URLs may or may not end in .pdf
      const slug = informe.url.split("/").pop() || "informe";
      const filename = slug.endsWith(".pdf") ? slug : `${slug}.pdf`;

      console.log(`    Downloading: ${filename}...`);
      const { filePath, text } = await downloadAndParsePdf(
        informe.url,
        filename
      );

      console.log(`    Text extracted (${text.length} chars)`);

      // Save informe FIRST (before PDFs that reference it)
      // Generate simplified content with AI if key is available
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "sua_chave_aqui") {
        console.log(`    Generating simplified content with AI...`);
        try {
          const generated = await generateSimplifiedContent(
            text.slice(0, 8000)
          );

          db.insert(schema.informes)
            .values({
              id: informeId,
              numero: informe.numero,
              titulo: informe.titulo,
              urlOriginal: informe.url,
              conteudoOriginal: text.slice(0, 50000),
              conteudoSimplificado: generated.conteudo,
              relevancia: generated.relevancia,
              tags: JSON.stringify(generated.tags),
            })
            .run();

          db.insert(schema.posts)
            .values({
              id: uuidv4(),
              informeId,
              titulo: generated.titulo,
              conteudo: generated.conteudo,
              resumo: generated.resumo,
              publicado: true,
            })
            .run();

          console.log(`    Generated: "${generated.titulo}"`);
          console.log(`    Relevancia: ${generated.relevancia}`);
          console.log(`    Tags: ${generated.tags.join(", ")}\n`);

          // Check CRAS status
          if (generated.alertaCras) {
            console.log(`    Analyzing CRAS status...`);
            const crasAnalysis = await analyzeCrasStatus(text.slice(0, 8000));
            const calendarData = extractOperationalCalendar(text);

            const today = new Date().toISOString().split("T")[0];
            db.insert(schema.crasStatus)
              .values({
                id: uuidv4(),
                data: today,
                sistemasAtivos: JSON.stringify([
                  ...new Set([
                    ...crasAnalysis.sistemasAtivos,
                    ...calendarData.sistemasAtivos,
                  ]),
                ]),
                sistemasInativos: JSON.stringify([
                  ...new Set([
                    ...crasAnalysis.sistemasInativos,
                    ...calendarData.sistemasInativos,
                  ]),
                ]),
                motivoInatividade:
                  crasAnalysis.motivoInatividade ||
                  calendarData.motivoInatividade,
                observacoes: crasAnalysis.observacoes,
                fonteInformeId: informeId,
                fonteUrl: informe.url,
              })
              .run();
            console.log(`    CRAS status saved\n`);
          }
        } catch (aiErr) {
          console.error(`    AI generation failed:`, aiErr);
          // Save without AI content
          db.insert(schema.informes)
            .values({
              id: informeId,
              numero: informe.numero,
              titulo: informe.titulo,
              urlOriginal: informe.url,
              conteudoOriginal: text.slice(0, 50000),
              relevancia: "media",
              tags: "[]",
            })
            .run();
        }
      } else {
        console.log(
          `    SKIP AI: No ANTHROPIC_API_KEY set. Saving raw text only.`
        );
        db.insert(schema.informes)
          .values({
            id: informeId,
            numero: informe.numero,
            titulo: informe.titulo,
            urlOriginal: informe.url,
            conteudoOriginal: text.slice(0, 50000),
            relevancia: "media",
            tags: "[]",
          })
          .run();
      }

      // Save PDF record AFTER informe (foreign key constraint)
      db.insert(schema.pdfs)
        .values({
          id: uuidv4(),
          informeId,
          url: informe.url,
          nomeArquivo: filename,
          caminhoLocal: filePath,
          textoExtraido: text,
          processado: true,
        })
        .run();

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (err) {
      console.error(`  ERROR processing ${informe.numero}:`, err);
    }
  }

  console.log("\n=== Manual Scrape Complete ===");

  // Show summary
  const totalInformes = db.select().from(schema.informes).all().length;
  const totalPosts = db.select().from(schema.posts).all().length;
  const totalPdfs = db.select().from(schema.pdfs).all().length;
  console.log(`\nDatabase summary:`);
  console.log(`  Informes: ${totalInformes}`);
  console.log(`  Posts: ${totalPosts}`);
  console.log(`  PDFs: ${totalPdfs}`);
}

main().catch(console.error);
