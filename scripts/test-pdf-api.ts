import { PDFParse } from "pdf-parse";
import fs from "fs";

async function test() {
  const buf = fs.readFileSync("./public/pdfs/informe-cadastro-unico-92.pdf");
  const pdf = new PDFParse({ data: new Uint8Array(buf) });
  await (pdf as any).load();
  const result = await pdf.getText();

  console.log("Type:", typeof result);
  console.log("Constructor:", result?.constructor?.name);
  console.log("Keys:", Object.keys(result));
  console.log("JSON:", JSON.stringify(result).slice(0, 500));

  pdf.destroy();
}

test().catch(console.error);
