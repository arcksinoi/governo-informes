import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getDb, collections } from "../src/lib/firebase/admin";
import { scrapeInformesList } from "../src/lib/scraper/mds-scraper";
import {
  downloadAndParsePdf,
  extractOperationalCalendar,
} from "../src/lib/scraper/pdf-downloader";
import { generateSimplifiedContent, analyzeCrasStatus } from "../src/lib/ai/content-generator";
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
    // Check if already exists in Firestore
    const existingSnap = await collections
      .informes()
      .where("numero", "==", informe.numero)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      console.log(`  SKIP: ${informe.numero} (already in database)`);
      continue;
    }

    console.log(`  PROCESSING: ${informe.numero}...`);
    const informeId = uuidv4();
    const now = new Date().toISOString();

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

      // Generate simplified content with AI if key is available
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "sua_chave_aqui") {
        console.log(`    Generating simplified content with AI...`);
        try {
          const generated = await generateSimplifiedContent(
            text.slice(0, 8000)
          );

          // Use batch write for atomicity
          const batch = getDb().batch();

          batch.set(collections.informes().doc(informeId), {
            numero: informe.numero,
            titulo: informe.titulo,
            urlOriginal: informe.url,
            conteudoOriginal: text.slice(0, 50000),
            conteudoSimplificado: generated.conteudo,
            relevancia: generated.relevancia,
            tags: generated.tags,
            createdAt: now,
            updatedAt: now,
          });

          const postId = uuidv4();
          batch.set(collections.posts(informeId).doc(postId), {
            titulo: generated.titulo,
            conteudo: generated.conteudo,
            resumo: generated.resumo,
            publicado: true,
            createdAt: now,
          });

          // Save PDF record
          const pdfId = uuidv4();
          batch.set(collections.pdfs(informeId).doc(pdfId), {
            url: informe.url,
            nomeArquivo: filename,
            caminhoLocal: filePath,
            textoExtraido: text,
            processado: true,
            createdAt: now,
          });

          await batch.commit();

          console.log(`    Generated: "${generated.titulo}"`);
          console.log(`    Relevancia: ${generated.relevancia}`);
          console.log(`    Tags: ${generated.tags.join(", ")}\n`);

          // Check CRAS status
          if (generated.alertaCras) {
            console.log(`    Analyzing CRAS status...`);
            const crasAnalysis = await analyzeCrasStatus(text.slice(0, 8000));
            const calendarData = extractOperationalCalendar(text);

            const today = new Date().toISOString().split("T")[0];
            const crasId = uuidv4();

            await collections.crasStatus().doc(crasId).set({
              data: today,
              sistemasAtivos: [
                ...new Set([
                  ...crasAnalysis.sistemasAtivos,
                  ...calendarData.sistemasAtivos,
                ]),
              ],
              sistemasInativos: [
                ...new Set([
                  ...crasAnalysis.sistemasInativos,
                  ...calendarData.sistemasInativos,
                ]),
              ],
              motivoInatividade:
                crasAnalysis.motivoInatividade ||
                calendarData.motivoInatividade,
              observacoes: crasAnalysis.observacoes,
              fonteInformeId: informeId,
              fonteUrl: informe.url,
              createdAt: now,
            });
            console.log(`    CRAS status saved\n`);
          }
        } catch (aiErr) {
          console.error(`    AI generation failed:`, aiErr);
          // Save without AI content
          const batch = getDb().batch();

          batch.set(collections.informes().doc(informeId), {
            numero: informe.numero,
            titulo: informe.titulo,
            urlOriginal: informe.url,
            conteudoOriginal: text.slice(0, 50000),
            relevancia: "media",
            tags: [],
            createdAt: now,
            updatedAt: now,
          });

          const pdfId = uuidv4();
          batch.set(collections.pdfs(informeId).doc(pdfId), {
            url: informe.url,
            nomeArquivo: filename,
            caminhoLocal: filePath,
            textoExtraido: text,
            processado: true,
            createdAt: now,
          });

          await batch.commit();
        }
      } else {
        console.log(
          `    SKIP AI: No OPENAI_API_KEY set. Saving raw text only.`
        );

        const batch = getDb().batch();

        batch.set(collections.informes().doc(informeId), {
          numero: informe.numero,
          titulo: informe.titulo,
          urlOriginal: informe.url,
          conteudoOriginal: text.slice(0, 50000),
          relevancia: "media",
          tags: [],
          createdAt: now,
          updatedAt: now,
        });

        const pdfId = uuidv4();
        batch.set(collections.pdfs(informeId).doc(pdfId), {
          url: informe.url,
          nomeArquivo: filename,
          caminhoLocal: filePath,
          textoExtraido: text,
          processado: true,
          createdAt: now,
        });

        await batch.commit();
      }

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (err) {
      console.error(`  ERROR processing ${informe.numero}:`, err);
    }
  }

  console.log("\n=== Manual Scrape Complete ===");

  // Show summary
  const informesSnap = await collections.informes().count().get();
  const crasSnap = await collections.crasStatus().count().get();
  console.log(`\nDatabase summary (Firestore):`);
  console.log(`  Informes: ${informesSnap.data().count}`);
  console.log(`  CRAS Status: ${crasSnap.data().count}`);
  console.log(`  (Posts and PDFs are in subcollections)`);
}

main().catch(console.error);
