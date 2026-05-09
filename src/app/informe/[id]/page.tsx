import SourceLink from "@/components/SourceLink";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { collections } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

interface InformeDetail {
  id: string;
  numero: string;
  titulo: string;
  dataPublicacao: string | null;
  urlOriginal: string;
  conteudoOriginal: string | null;
  conteudoSimplificado: string | null;
  relevancia: string | null;
  tags: string[];
  createdAt: string;
  post: {
    titulo: string;
    resumo: string | null;
    conteudo: string;
  } | null;
  pdfs: {
    url: string;
    nomeArquivo: string;
  }[];
}

async function getInforme(id: string): Promise<InformeDetail | null> {
  try {
    const informeDoc = await collections.informes().doc(id).get();
    if (!informeDoc.exists) return null;

    const data = informeDoc.data()!;

    // Get post from subcollection
    const postSnap = await collections.posts(id).limit(1).get();
    const post = postSnap.empty ? null : postSnap.docs[0].data();

    // Get PDFs from subcollection
    const pdfsSnap = await collections.pdfs(id).get();
    const pdfs = pdfsSnap.docs.map((doc) => {
      const d = doc.data();
      return { url: d.url, nomeArquivo: d.nomeArquivo };
    });

    return {
      id: informeDoc.id,
      numero: data.numero,
      titulo: data.titulo,
      dataPublicacao: data.dataPublicacao || null,
      urlOriginal: data.urlOriginal,
      conteudoOriginal: data.conteudoOriginal || null,
      conteudoSimplificado: data.conteudoSimplificado || null,
      relevancia: data.relevancia || null,
      tags: data.tags || [],
      createdAt: data.createdAt,
      post: post
        ? {
            titulo: post.titulo,
            resumo: post.resumo || null,
            conteudo: post.conteudo,
          }
        : null,
      pdfs,
    };
  } catch (err) {
    console.error("Error fetching informe:", err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const informe = await getInforme(id);
  if (!informe) {
    return { title: "Noticia nao encontrada" };
  }
  return {
    title: `${informe.post?.titulo || informe.titulo} - Compadre do CadUnico`,
    description: informe.post?.resumo || informe.titulo,
  };
}

export default async function InformePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const informe = await getInforme(id);

  if (!informe) {
    notFound();
  }

  const dataFormatada = new Date(informe.createdAt).toLocaleDateString(
    "pt-BR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  const relevanciaLabels: Record<
    string,
    { label: string; className: string }
  > = {
    alta: { label: "IMPORTANTE", className: "bg-red-100 text-red-800" },
    media: {
      label: "FIQUE ATENTO",
      className: "bg-yellow-100 text-yellow-800",
    },
    baixa: { label: "INFORMACAO", className: "bg-blue-100 text-blue-800" },
  };

  const rel =
    relevanciaLabels[informe.relevancia || "media"] || relevanciaLabels.media;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Voltar */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 mb-5 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Voltar pro inicio
      </Link>

      <article className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${rel.className}`}
            >
              {rel.label}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            {informe.post?.titulo || informe.titulo}
          </h1>
          <p className="text-sm text-gray-500 mt-2">{dataFormatada}</p>
        </div>

        {/* Resumo */}
        {informe.post?.resumo && (
          <div className="px-4 sm:px-6 py-4 bg-green-50 border-b border-green-100">
            <p className="text-green-800 font-medium leading-relaxed text-sm sm:text-base">
              {informe.post.resumo}
            </p>
          </div>
        )}

        {/* Conteudo */}
        <div className="px-4 sm:px-6 py-5 sm:py-6">
          {informe.post?.conteudo ? (
            <div className="prose prose-green max-w-none">
              {informe.post.conteudo.split("\n").map((paragraph, i) =>
                paragraph.trim() ? (
                  <p
                    key={i}
                    className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base"
                  >
                    {paragraph}
                  </p>
                ) : null
              )}
            </div>
          ) : informe.conteudoSimplificado ? (
            <div className="prose max-w-none">
              {informe.conteudoSimplificado.split("\n").map((paragraph, i) =>
                paragraph.trim() ? (
                  <p
                    key={i}
                    className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base"
                  >
                    {paragraph}
                  </p>
                ) : null
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic text-sm sm:text-base">
              Essa noticia ainda nao foi simplificada. Voce pode ver o documento
              original no link abaixo.
            </p>
          )}
        </div>

        {/* Tags */}
        {informe.tags.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1.5">
              {informe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs min-h-0"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* PDFs */}
        {informe.pdfs && informe.pdfs.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 mb-2">
              Documentos originais do governo:
            </h3>
            <ul className="space-y-2">
              {informe.pdfs.map((pdf) => (
                <li key={pdf.url}>
                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-green-700 hover:text-green-900 active:text-green-950 transition-colors py-1"
                  >
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {pdf.nomeArquivo}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Fonte */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <SourceLink url={informe.urlOriginal} />
            <p className="text-xs text-gray-400">
              Informacoes extraidas do documento oficial do governo
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
