import axios from "axios";
import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

const PDF_DIR = path.join(process.cwd(), "public", "pdfs");

/**
 * Downloads a PDF file from a URL and saves it locally.
 */
export async function downloadPdf(
  url: string,
  filename: string
): Promise<string> {
  // Ensure PDF directory exists
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
  }

  const filePath = path.join(PDF_DIR, filename);

  // Skip if already downloaded
  if (fs.existsSync(filePath)) {
    console.log(`PDF already exists: ${filename}`);
    return filePath;
  }

  const response = await axios.get(url, {
    responseType: "arraybuffer",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/pdf,*/*",
    },
    timeout: 60000,
    maxRedirects: 5,
  });

  fs.writeFileSync(filePath, response.data);
  console.log(`Downloaded PDF: ${filename} (${response.data.length} bytes)`);

  return filePath;
}

/**
 * Extracts text content from a PDF file using pdf-parse v2.
 */
export async function extractPdfText(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const pdf = new PDFParse({ data: new Uint8Array(dataBuffer) });
  // load() is needed to initialize - use any to bypass private access in typedefs
  await (pdf as any).load();
  const textResult = await pdf.getText();
  pdf.destroy();
  // getText() returns { pages: [...], text: string, total: number }
  const result = textResult as any;
  return result.text || "";
}

/**
 * Downloads and extracts text from a PDF URL.
 */
export async function downloadAndParsePdf(
  url: string,
  filename: string
): Promise<{ filePath: string; text: string }> {
  const filePath = await downloadPdf(url, filename);
  const text = await extractPdfText(filePath);
  return { filePath, text };
}

/**
 * Extracts operational calendar info from PDF text.
 * Looks for patterns indicating system downtime, maintenance windows, etc.
 */
export function extractOperationalCalendar(text: string): {
  sistemasInativos: string[];
  sistemasAtivos: string[];
  motivoInatividade: string | null;
  datasInatividade: string[];
  observacoes: string | null;
} {
  const result = {
    sistemasInativos: [] as string[],
    sistemasAtivos: [] as string[],
    motivoInatividade: null as string | null,
    datasInatividade: [] as string[],
    observacoes: null as string | null,
  };

  const textLower = text.toLowerCase();

  // Known CadUnico systems
  const knownSystems = [
    "SIBEC",
    "SICON",
    "CECAD",
    "SIGPBF",
    "Sistema de Cadastro Único",
    "Cadastro Único",
    "V7",
    "Versão 7",
    "Sistema de Benefícios",
    "CAIXA",
  ];

  // Check for system downtime patterns
  const downtimePatterns = [
    /indisponível|indisponibilidade|fora do ar|manutenção|parada|interrupção|suspens[ãa]o/gi,
    /n[ãa]o estar[áa] dispon[íi]vel|n[ãa]o funcionar[áa]/gi,
    /sistema.*parado|sistema.*suspenso|sistema.*inativo/gi,
  ];

  let hasDowntime = false;
  for (const pattern of downtimePatterns) {
    if (pattern.test(textLower)) {
      hasDowntime = true;
      break;
    }
  }

  if (hasDowntime) {
    // Try to identify which systems are affected
    for (const system of knownSystems) {
      const systemLower = system.toLowerCase();
      // Check if system is mentioned near downtime keywords
      const nearDowntime = new RegExp(
        `${systemLower}.{0,100}(indisponível|fora|manutenção|parad|suspen|inativ)|(indisponível|fora|manutenção|parad|suspen|inativ).{0,100}${systemLower}`,
        "i"
      );
      if (nearDowntime.test(textLower)) {
        result.sistemasInativos.push(system);
      }
    }

    // Extract reason for downtime
    const reasonPatterns = [
      /motivo[:\s]+(.+?)(?:\.|$)/im,
      /devido [àa]\s+(.+?)(?:\.|$)/im,
      /em raz[ãa]o d[eao]\s+(.+?)(?:\.|$)/im,
      /manutenção\s+(.+?)(?:\.|$)/im,
    ];

    for (const pattern of reasonPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.motivoInatividade = match[1].trim();
        break;
      }
    }

    // Extract dates of downtime
    const datePatterns = [
      /(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})/g,
      /(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/g,
    ];

    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        result.datasInatividade.push(...matches.slice(0, 10));
      }
    }
  }

  // Systems that are explicitly mentioned as available
  for (const system of knownSystems) {
    if (
      !result.sistemasInativos.includes(system) &&
      textLower.includes(system.toLowerCase())
    ) {
      result.sistemasAtivos.push(system);
    }
  }

  return result;
}
