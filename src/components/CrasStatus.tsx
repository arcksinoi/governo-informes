interface CrasStatusProps {
  status: "pode_ir" | "nao_ir" | "cautela" | "sem_dados";
  mensagem: string;
  data: string;
  sistemasAtivos: string[];
  sistemasInativos: string[];
  motivoInatividade: string | null;
  observacoes: string | null;
  fonteUrl: string | null;
  ultimaAtualizacao: string | null;
}

const statusConfig = {
  pode_ir: {
    icon: (
      <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-500",
    titleColor: "text-green-800",
    title: "Pode ir sim!",
  },
  nao_ir: {
    icon: (
      <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    titleColor: "text-red-800",
    title: "Melhor nao ir hoje!",
  },
  cautela: {
    icon: (
      <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-500",
    titleColor: "text-amber-800",
    title: "Cuidado!",
  },
  sem_dados: {
    icon: (
      <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: "bg-gray-50",
    border: "border-gray-200",
    iconColor: "text-gray-400",
    titleColor: "text-gray-700",
    title: "Sem informacoes",
  },
};

export default function CrasStatus({
  status,
  mensagem,
  data,
  sistemasAtivos,
  sistemasInativos,
  motivoInatividade,
  observacoes,
  fonteUrl,
  ultimaAtualizacao,
}: CrasStatusProps) {
  const config = statusConfig[status];
  const dataFormatada = new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <div
        className={`rounded-2xl border-2 ${config.border} ${config.bg} p-8 text-center`}
      >
        <div className={`inline-flex ${config.iconColor} mb-4`}>{config.icon}</div>
        <h2 className={`text-3xl font-bold ${config.titleColor} mb-2`}>
          {config.title}
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed max-w-xl mx-auto">
          {mensagem}
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Referente a: <strong>{dataFormatada}</strong>
        </p>
      </div>

      {/* Systems Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Systems */}
        {sistemasAtivos.length > 0 && (
          <div className="bg-white rounded-xl border border-green-200 p-5">
            <h3 className="flex items-center gap-2 text-green-800 font-semibold mb-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Sistemas Funcionando
            </h3>
            <ul className="space-y-1.5">
              {sistemasAtivos.map((s) => (
                <li
                  key={s}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Inactive Systems */}
        {sistemasInativos.length > 0 && (
          <div className="bg-white rounded-xl border border-red-200 p-5">
            <h3 className="flex items-center gap-2 text-red-800 font-semibold mb-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Sistemas com Problema
            </h3>
            <ul className="space-y-1.5">
              {sistemasInativos.map((s) => (
                <li
                  key={s}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {s}
                </li>
              ))}
            </ul>
            {motivoInatividade && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                <strong>Motivo:</strong> {motivoInatividade}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Additional Info */}
      {observacoes && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-2">
            Informacoes Adicionais
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{observacoes}</p>
        </div>
      )}

      {/* Always show CRAS disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex gap-3">
          <svg
            className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-800 mb-1">
              Em caso de duvida, consulte seu CRAS!
            </h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              Essas informacoes sao baseadas nos informes oficiais do MDS, mas
              cada municipio pode ter suas particularidades. Se voce tiver
              qualquer duvida, ligue ou va diretamente ao CRAS da sua cidade.
            </p>
          </div>
        </div>
      </div>

      {/* Source */}
      {fonteUrl && (
        <div className="text-center text-sm text-gray-500">
          <a
            href={fonteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-green-700 transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Fonte: Informe oficial do MDS - gov.br
          </a>
          {ultimaAtualizacao && (
            <p className="mt-1 text-xs text-gray-400">
              Ultima atualizacao:{" "}
              {new Date(ultimaAtualizacao).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
