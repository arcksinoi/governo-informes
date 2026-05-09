import OpenAI from "openai";
import { SYSTEM_PROMPT, CONTENT_PROMPT, CRAS_STATUS_PROMPT } from "./prompts";

// Lazy-initialize the OpenAI client so env vars loaded by dotenv are available
let _openai: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "http://localhost:20128/v1",
      defaultHeaders: {
        "User-Agent": "Mozilla/5.0",
      },
    });
  }
  return _openai;
}

function getModel(): string {
  return process.env.AI_MODEL || "cx/gpt-5.5";
}

export interface GeneratedContent {
  titulo: string;
  resumo: string;
  conteudo: string;
  relevancia: "alta" | "media" | "baixa";
  tags: string[];
  alertaCras: boolean;
  sistemasAfetados: string[];
}

export interface CrasStatusAnalysis {
  sistemasAtivos: string[];
  sistemasInativos: string[];
  motivoInatividade: string | null;
  datasAfetadas: string[];
  observacoes: string | null;
  recomendacao: "ir" | "nao_ir" | "cautela";
  mensagemPopular: string;
}

/**
 * Generates simplified content from an official informe text.
 * Uses an OpenAI-compatible API (local proxy).
 * The content is generated in Northeastern Brazilian Portuguese (Piauí dialect).
 */
export async function generateSimplifiedContent(
  textoExtraido: string
): Promise<GeneratedContent> {
  const prompt = CONTENT_PROMPT.replace("{TEXTO_EXTRAIDO}", textoExtraido);

  const completion = await getClient().chat.completions.create({
    model: getModel(),
    max_tokens: 2000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  const responseText = completion.choices[0]?.message?.content || "";

  // Extract JSON from response (handle potential markdown code blocks)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedContent;

  // Validate required fields
  if (!parsed.titulo || !parsed.conteudo) {
    throw new Error("AI response missing required fields (titulo, conteudo)");
  }

  return {
    titulo: parsed.titulo,
    resumo: parsed.resumo || "",
    conteudo: parsed.conteudo,
    relevancia: parsed.relevancia || "media",
    tags: parsed.tags || [],
    alertaCras: parsed.alertaCras || false,
    sistemasAfetados: parsed.sistemasAfetados || [],
  };
}

/**
 * Analyzes informe text to determine CRAS system status.
 */
export async function analyzeCrasStatus(
  textoExtraido: string
): Promise<CrasStatusAnalysis> {
  const prompt = CRAS_STATUS_PROMPT.replace("{TEXTO_EXTRAIDO}", textoExtraido);

  const completion = await getClient().chat.completions.create({
    model: getModel(),
    max_tokens: 1500,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  const responseText = completion.choices[0]?.message?.content || "";

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse CRAS status AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as CrasStatusAnalysis;

  return {
    sistemasAtivos: parsed.sistemasAtivos || [],
    sistemasInativos: parsed.sistemasInativos || [],
    motivoInatividade: parsed.motivoInatividade || null,
    datasAfetadas: parsed.datasAfetadas || [],
    observacoes: parsed.observacoes || null,
    recomendacao: parsed.recomendacao || "cautela",
    mensagemPopular:
      parsed.mensagemPopular ||
      "Nao foi possivel determinar. Consulte seu CRAS diretamente.",
  };
}
