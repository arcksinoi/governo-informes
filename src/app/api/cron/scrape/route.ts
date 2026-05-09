import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { scrapeInformesList, extractPdfLinks } from "@/lib/scraper/mds-scraper";
import { downloadAndParsePdf, extractOperationalCalendar } from "@/lib/scraper/pdf-downloader";
import { generateSimplifiedContent, analyzeCrasStatus } from "@/lib/ai/content-generator";
import { sendInformeNotification } from "@/lib/notifications/email";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for Vercel

/**
 * Cron endpoint: scrapes MDS website, downloads PDFs, generates simplified content.
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    timestamp: new Date().toISOString(),
    informesFound: 0,
    newInformes: 0,
    pdfsProcessed: 0,
    postsGenerated: 0,
    emailsSent: 0,
    errors: [] as string[],
  };

  try {
    // Step 1: Scrape informes list
    console.log("[CRON] Starting MDS scrape...");
    const informesList = await scrapeInformesList();
    results.informesFound = informesList.length;
    console.log(`[CRON] Found ${informesList.length} informes`);

    // Step 2: Process up to 5 newest informes
    const latestInformes = informesList.slice(0, 5);

    for (const informe of latestInformes) {
      try {
        // Check if already in database
        const existing = db
          .select()
          .from(schema.informes)
          .where(eq(schema.informes.numero, informe.numero))
          .get();

        if (existing) {
          console.log(`[CRON] Informe ${informe.numero} already processed, skipping`);
          continue;
        }

        results.newInformes++;
        console.log(`[CRON] Processing new ${informe.numero}...`);

        // Step 3: Extract and download PDFs
        const pdfLinks = await extractPdfLinks(informe.url);
        let fullText = "";

        const informeId = uuidv4();

        // Collect PDF data first, save to DB after informe is inserted (FK constraint)
        const pdfRecords: Array<{
          id: string;
          url: string;
          nomeArquivo: string;
          caminhoLocal?: string;
          textoExtraido?: string;
          processado: boolean;
          erro?: string;
        }> = [];

        for (const pdf of pdfLinks.slice(0, 3)) {
          try {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Rate limit
            const { filePath, text } = await downloadAndParsePdf(pdf.url, pdf.nomeArquivo);

            pdfRecords.push({
              id: uuidv4(),
              url: pdf.url,
              nomeArquivo: pdf.nomeArquivo,
              caminhoLocal: filePath,
              textoExtraido: text,
              processado: true,
            });

            fullText += text + "\n\n";
            results.pdfsProcessed++;
          } catch (pdfErr) {
            const errMsg = `Failed to process PDF ${pdf.nomeArquivo}: ${pdfErr}`;
            console.error(`[CRON] ${errMsg}`);
            results.errors.push(errMsg);

            pdfRecords.push({
              id: uuidv4(),
              url: pdf.url,
              nomeArquivo: pdf.nomeArquivo,
              processado: false,
              erro: String(pdfErr),
            });
          }
        }

        if (!fullText.trim()) {
          console.warn(`[CRON] No text extracted for ${informe.numero}`);
          // Save informe without content
          db.insert(schema.informes).values({
            id: informeId,
            numero: informe.numero,
            titulo: informe.titulo,
            dataPublicacao: informe.dataPublicacao || null,
            urlOriginal: informe.url,
            conteudoOriginal: "",
            relevancia: "baixa",
            tags: "[]",
          }).run();

          // Now save PDF records (after informe exists)
          for (const rec of pdfRecords) {
            db.insert(schema.pdfs).values({ ...rec, informeId }).run();
          }
          continue;
        }

        // Step 4: Generate simplified content with AI
        let generated;
        try {
          generated = await generateSimplifiedContent(fullText.slice(0, 8000));
        } catch (aiErr) {
          const errMsg = `AI generation failed for ${informe.numero}: ${aiErr}`;
          console.error(`[CRON] ${errMsg}`);
          results.errors.push(errMsg);

          // Save informe with original text only
          db.insert(schema.informes).values({
            id: informeId,
            numero: informe.numero,
            titulo: informe.titulo,
            dataPublicacao: informe.dataPublicacao || null,
            urlOriginal: informe.url,
            conteudoOriginal: fullText.slice(0, 50000),
            relevancia: "media",
            tags: "[]",
          }).run();

          // Save PDF records after informe
          for (const rec of pdfRecords) {
            db.insert(schema.pdfs).values({ ...rec, informeId }).run();
          }
          continue;
        }

        // Step 5: Save informe to database (BEFORE PDFs due to FK constraint)
        db.insert(schema.informes).values({
          id: informeId,
          numero: informe.numero,
          titulo: informe.titulo,
          dataPublicacao: informe.dataPublicacao || null,
          urlOriginal: informe.url,
          conteudoOriginal: fullText.slice(0, 50000),
          conteudoSimplificado: generated.conteudo,
          relevancia: generated.relevancia,
          tags: JSON.stringify(generated.tags),
        }).run();

        // Save PDF records after informe exists
        for (const rec of pdfRecords) {
          db.insert(schema.pdfs).values({ ...rec, informeId }).run();
        }

        // Step 6: Create post
        db.insert(schema.posts).values({
          id: uuidv4(),
          informeId,
          titulo: generated.titulo,
          conteudo: generated.conteudo,
          resumo: generated.resumo,
          publicado: true,
        }).run();
        results.postsGenerated++;

        // Step 7: Analyze CRAS status if relevant
        if (generated.alertaCras || generated.tags.some((t: string) =>
          ["calendario", "sistema", "cras", "indisponivel"].some((k) =>
            t.toLowerCase().includes(k)
          )
        )) {
          try {
            const crasAnalysis = await analyzeCrasStatus(fullText.slice(0, 8000));
            const calendarData = extractOperationalCalendar(fullText);

            const today = new Date().toISOString().split("T")[0];
            db.insert(schema.crasStatus).values({
              id: uuidv4(),
              data: today,
              sistemasAtivos: JSON.stringify([
                ...new Set([...crasAnalysis.sistemasAtivos, ...calendarData.sistemasAtivos]),
              ]),
              sistemasInativos: JSON.stringify([
                ...new Set([...crasAnalysis.sistemasInativos, ...calendarData.sistemasInativos]),
              ]),
              motivoInatividade:
                crasAnalysis.motivoInatividade || calendarData.motivoInatividade,
              observacoes: crasAnalysis.observacoes,
              fonteInformeId: informeId,
              fonteUrl: informe.url,
            }).run();
          } catch (crasErr) {
            console.error(`[CRON] CRAS analysis failed: ${crasErr}`);
            results.errors.push(`CRAS analysis failed: ${crasErr}`);
          }
        }

        // Step 8: Send email notification for high-relevance informes
        if (generated.relevancia === "alta") {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
            await sendInformeNotification({
              titulo: generated.titulo,
              resumo: generated.resumo,
              conteudo: generated.conteudo,
              fonteUrl: informe.url,
              informeNumero: informe.numero,
              siteUrl: `${baseUrl}/informe/${informeId}`,
            });
            results.emailsSent++;
          } catch (emailErr) {
            console.error(`[CRON] Email notification failed: ${emailErr}`);
            results.errors.push(`Email failed: ${emailErr}`);
          }
        }

        // Rate limiting between informes
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (informeErr) {
        const errMsg = `Failed to process ${informe.numero}: ${informeErr}`;
        console.error(`[CRON] ${errMsg}`);
        results.errors.push(errMsg);
      }
    }

    console.log("[CRON] Scrape completed:", results);
    return NextResponse.json(results);
  } catch (err) {
    console.error("[CRON] Fatal error:", err);
    return NextResponse.json(
      { error: "Scrape failed", details: String(err) },
      { status: 500 }
    );
  }
}
