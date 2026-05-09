import { downloadAndParsePdf } from "../src/lib/scraper/pdf-downloader";

async function test() {
  console.log("Testing PDF download and parsing...\n");

  const url =
    "https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico/informes/informe-cadastro-unico-92";

  try {
    const { filePath, text } = await downloadAndParsePdf(
      url,
      "informe-cadastro-unico-92.pdf"
    );
    console.log(`File saved: ${filePath}`);
    console.log(`Text length: ${text.length} chars\n`);
    console.log("First 1000 chars:");
    console.log("---");
    console.log(text.slice(0, 1000));
    console.log("---");
  } catch (err) {
    console.error("Error:", err);
  }
}

test().catch(console.error);
