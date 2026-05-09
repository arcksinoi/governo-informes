interface CrasStatusProps {
  status: "pode_ir" | "nao_ir" | "cautela" | "sem_dados";
  mensagem: string;
  data: string;
  sistemasInativos: string[];
  motivoInatividade: string | null;
  observacoes: string | null;
  fonteUrl: string | null;
  ultimaAtualizacao: string | null;
}

const statusConfig = {
  pode_ir: {
    emoji: "✅",
    bg: "bg-green-50",
    border: "border-green-300",
    titleColor: "text-green-800",
    title: "Pode ir ao CRAS!",
  },
  nao_ir: {
    emoji: "❌",
    bg: "bg-red-50",
    border: "border-red-300",
    titleColor: "text-red-800",
    title: "Melhor nao ir hoje!",
  },
  cautela: {
    emoji: "⚠️",
    bg: "bg-amber-50",
    border: "border-amber-300",
    titleColor: "text-amber-800",
    title: "Cuidado antes de ir!",
  },
  sem_dados: {
    emoji: "❓",
    bg: "bg-gray-50",
    border: "border-gray-300",
    titleColor: "text-gray-700",
    title: "Sem informacoes no momento",
  },
};

export default function CrasStatus({
  status,
  mensagem,
  data,
  sistemasInativos,
  motivoInatividade,
  observacoes,
  fonteUrl,
  ultimaAtualizacao,
}: CrasStatusProps) {
  const config = statusConfig[status];
  const dataFormatada = new Date(data + "T12:00:00").toLocaleDateString(
    "pt-BR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="space-y-5">
      {/* Card principal - grande e claro */}
      <div
        className={`rounded-2xl border-2 ${config.border} ${config.bg} p-6 sm:p-8 text-center`}
      >
        <div className="text-5xl sm:text-6xl mb-4">{config.emoji}</div>
        <h2
          className={`text-2xl sm:text-3xl font-bold ${config.titleColor} mb-3`}
        >
          {config.title}
        </h2>
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-xl mx-auto">
          {mensagem}
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Informacao de: <strong>{dataFormatada}</strong>
        </p>
      </div>

      {/* Sistemas com problema - SÓ aparece se tiver problemas */}
      {sistemasInativos.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-red-200 p-5">
          <h3 className="flex items-center gap-2 text-red-800 font-bold text-base mb-3">
            <span className="text-xl">🚫</span>
            O que nao esta funcionando hoje
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Esses sistemas sao usados pelos funcionarios do CRAS pra fazer
            cadastros e consultas. Se eles estao com problema, alguns servicos
            podem nao funcionar:
          </p>
          <ul className="space-y-2">
            {sistemasInativos.map((s) => (
              <li
                key={s}
                className="flex items-center gap-2.5 text-sm sm:text-base text-gray-800 bg-red-50 rounded-lg px-4 py-2.5"
              >
                <span className="text-red-500 text-lg">✖</span>
                <span className="font-medium">{s}</span>
              </li>
            ))}
          </ul>
          {motivoInatividade && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700 border border-red-100">
              <strong>Por que nao funciona:</strong> {motivoInatividade}
            </div>
          )}
        </div>
      )}

      {/* AVISO IMPORTANTE: Assistência social */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
        <div className="flex gap-3">
          <span className="text-2xl flex-shrink-0">🏠</span>
          <div>
            <h3 className="font-bold text-green-800 text-base mb-2">
              O CRAS atende muito mais que so o CadUnico!
            </h3>
            <p className="text-sm sm:text-base text-green-700 leading-relaxed">
              Se voce precisa de ajuda com <strong>assistencia social</strong>,
              como orientacoes sobre familia, criancas, idosos, pessoas com
              deficiencia ou qualquer outro assunto que{" "}
              <strong>nao seja do Cadastro Unico</strong>, o CRAS continua
              atendendo normalmente, mesmo quando os sistemas do CadUnico estao
              com problema.
            </p>
            <p className="text-sm text-green-600 mt-2 font-medium">
              👉 Nesses casos, pode ir ao CRAS sem preocupacao!
            </p>
          </div>
        </div>
      </div>

      {/* Informacoes extras */}
      {observacoes && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-2 text-base">
            Mais informacoes
          </h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {observacoes}
          </p>
        </div>
      )}

      {/* Aviso "em caso de duvida" */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
        <div className="flex gap-3">
          <span className="text-2xl flex-shrink-0">📞</span>
          <div>
            <h3 className="font-bold text-blue-800 mb-1 text-base">
              Ficou na duvida? Ligue pro CRAS!
            </h3>
            <p className="text-sm sm:text-base text-blue-700 leading-relaxed">
              As informacoes desse site vem dos documentos oficiais do governo,
              mas cada cidade pode ser diferente. Se voce nao tem certeza,{" "}
              <strong>ligue ou va ao CRAS da sua cidade</strong> pra confirmar.
            </p>
          </div>
        </div>
      </div>

      {/* Fonte */}
      {fonteUrl && (
        <div className="text-center text-sm text-gray-500">
          <a
            href={fonteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-green-700 transition-colors inline-flex items-center gap-1.5 underline"
          >
            Ver documento oficial no site do governo
          </a>
          {ultimaAtualizacao && (
            <p className="mt-1 text-xs text-gray-400">
              Atualizado em:{" "}
              {new Date(ultimaAtualizacao).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
