import axios from "axios";
import * as cheerio from "cheerio";

const MDS_BASE_URL =
  "https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico/informes";

export interface InformeLink {
  numero: string;
  titulo: string;
  url: string;
  dataPublicacao?: string;
}

export interface PdfLink {
  url: string;
  nomeArquivo: string;
}

/**
 * Scrapes the MDS informes listing page.
 *
 * The page at gov.br/mds/.../informes lists informes as links like:
 *   - "Informe Cadastro Único 92" -> /informes/informe-cadastro-unico-92
 *   - "Informe Cadastro Único 80" -> /informes/informe-cadastro-unico-80
 *
 * Each informe link points DIRECTLY to a PDF (served inline by gov.br).
 * The PDF URL follows the pattern:
 *   https://www.gov.br/mds/pt-br/.../informes/informe-cadastro-unico-{N}
 *
 * There are also year-based directories with .pdf files like:
 *   /informes/2025/informe_cadastro_unico_n_80.pdf
 */
export async function scrapeInformesList(): Promise<InformeLink[]> {
  const response = await axios.get(MDS_BASE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
    timeout: 30000,
  });

  const $ = cheerio.load(response.data);
  const informes: InformeLink[] = [];

  // The listing page has links like:
  //   <a href=".../informe-cadastro-unico-92" title="Link">Informe Cadastro Único 92</a>
  // These are in the main content area (#content-core or similar Plone container)
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href") || "";
    const text = $(element).text().trim();

    // Match: links containing "informe" in the /informes/ path
    // URL pattern: /informes/informe-cadastro-unico-{N} or /informes/informe-bolsa-familia-{N}
    const isInformeLink =
      href.includes("/informes/informe-") ||
      (href.includes("/informes/") &&
        href.includes("informe") &&
        !href.includes("?") &&
        href !== MDS_BASE_URL &&
        !href.endsWith("/informes") &&
        !href.endsWith("/informes/"));

    if (!isInformeLink) return;

    // Extract informe number from text or URL
    const numFromText = text.match(/(\d+)\s*$/);
    const numFromUrl = href.match(/[-_](\d+)(?:\.pdf)?$/);
    const numero = numFromText?.[1] || numFromUrl?.[1] || "";

    if (!numero) return;

    const fullUrl = href.startsWith("http")
      ? href
      : `https://www.gov.br${href}`;

    // Skip duplicates
    if (informes.find((i) => i.url === fullUrl)) return;

    informes.push({
      numero: `Informe ${numero}`,
      titulo: text || `Informe Cadastro Unico ${numero}`,
      url: fullUrl,
      dataPublicacao: undefined,
    });
  });

  // Sort by number descending (newest first)
  informes.sort((a, b) => {
    const numA = parseInt(a.numero.replace(/\D/g, "")) || 0;
    const numB = parseInt(b.numero.replace(/\D/g, "")) || 0;
    return numB - numA;
  });

  // Deduplicate by numero (keep first = highest priority URL)
  const seen = new Set<string>();
  return informes.filter((informe) => {
    if (seen.has(informe.numero)) return false;
    seen.add(informe.numero);
    return true;
  });
}

/**
 * Determines the direct PDF URL for an informe.
 *
 * On gov.br, each informe page IS a PDF served inline.
 * So the URL itself is the PDF - we just need to download it as binary.
 *
 * Some informes also have explicit .pdf URLs in year directories.
 */
export async function extractPdfLinks(informeUrl: string): Promise<PdfLink[]> {
  // The informe URL IS the PDF (gov.br serves PDFs inline at these URLs)
  // Extract a filename from the URL slug
  const slug = informeUrl.split("/").pop() || "informe";
  const nomeArquivo = slug.endsWith(".pdf") ? slug : `${slug}.pdf`;

  return [{ url: informeUrl, nomeArquivo }];
}
