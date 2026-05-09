import Link from "next/link";

interface InformeCardProps {
  id: string;
  numero: string;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  relevancia: string | null;
  tags: string[];
  urlOriginal: string;
  createdAt: string;
}

const relevanciaStyles: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  alta: { bg: "bg-red-100", text: "text-red-800", label: "IMPORTANTE" },
  media: { bg: "bg-yellow-100", text: "text-yellow-800", label: "FIQUE ATENTO" },
  baixa: { bg: "bg-blue-100", text: "text-blue-800", label: "INFORMACAO" },
};

export default function InformeCard({
  id,
  numero,
  titulo,
  resumo,
  conteudo,
  relevancia,
  tags,
  urlOriginal,
  createdAt,
}: InformeCardProps) {
  const style =
    relevanciaStyles[relevancia || "media"] || relevanciaStyles.media;
  const dataFormatada = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <article
      className={`rounded-xl border bg-white shadow-sm hover:shadow-md active:shadow-sm transition-shadow overflow-hidden ${
        relevancia === "alta"
          ? "border-red-300 ring-2 ring-red-100"
          : "border-gray-200"
      }`}
    >
      {/* Badge + data */}
      <div className="flex items-center gap-2 px-4 sm:px-5 pt-4 flex-wrap">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}
        >
          {style.label}
        </span>
        <span className="text-xs text-gray-400 ml-auto">{dataFormatada}</span>
      </div>

      {/* Conteudo */}
      <div className="px-4 sm:px-5 py-3">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 leading-snug">
          {titulo}
        </h2>

        {resumo && (
          <p className="text-gray-600 text-sm leading-relaxed mb-2">
            {resumo}
          </p>
        )}

        {conteudo && !resumo && (
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
            {conteudo}
          </p>
        )}

        {/* Tags - so se tiver */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 min-h-0"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Acoes - botoes grandes pro celular */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-gray-50 border-t border-gray-100 gap-2">
        <Link
          href={`/informe/${id}`}
          className="text-green-700 hover:text-green-900 active:text-green-950 text-sm font-bold transition-colors py-1"
        >
          Ler a noticia completa →
        </Link>
        <a
          href={urlOriginal}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 py-1 min-h-0"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Fonte oficial
        </a>
      </div>
    </article>
  );
}
