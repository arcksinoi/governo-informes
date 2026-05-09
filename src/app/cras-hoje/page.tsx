import CrasStatusComponent from "@/components/CrasStatus";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ir no CRAS Hoje? - Compadre do CadUnico",
  description:
    "Verifique se os sistemas do CRAS estao funcionando antes de sair de casa. Informacao atualizada do Cadastro Unico.",
};

async function getCrasStatus() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/informes/cras-status`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        status: "sem_dados" as const,
        mensagem:
          "Num conseguimos verificar os sistemas agora. Melhor ligar pro CRAS antes de ir, viu?",
        data: new Date().toISOString().split("T")[0],
        sistemasAtivos: [],
        sistemasInativos: [],
        motivoInatividade: null,
        observacoes: null,
        fonteUrl: null,
        ultimaAtualizacao: null,
      };
    }
    return await res.json();
  } catch {
    return {
      status: "sem_dados" as const,
      mensagem:
        "Eita, deu um problema pra buscar as informacoes. Tente novamente ou ligue pro seu CRAS.",
      data: new Date().toISOString().split("T")[0],
      sistemasAtivos: [],
      sistemasInativos: [],
      motivoInatividade: null,
      observacoes: null,
      fonteUrl: null,
      ultimaAtualizacao: null,
    };
  }
}

export default async function CrasHojePage() {
  const crasStatus = await getCrasStatus();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Ir no CRAS Hoje?
        </h1>
        <p className="text-gray-600">
          Veja se os sistemas do Cadastro Unico tao funcionando antes de sair de
          casa.
        </p>
      </div>

      <CrasStatusComponent
        status={crasStatus.status}
        mensagem={crasStatus.mensagem}
        data={crasStatus.data}
        sistemasAtivos={crasStatus.sistemasAtivos}
        sistemasInativos={crasStatus.sistemasInativos}
        motivoInatividade={crasStatus.motivoInatividade}
        observacoes={crasStatus.observacoes}
        fonteUrl={crasStatus.fonteUrl}
        ultimaAtualizacao={crasStatus.ultimaAtualizacao}
      />

      {/* FAQ */}
      <div className="mt-10 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Perguntas Frequentes
        </h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-gray-700 mb-1">
              De onde vem essas informacoes?
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Direto dos informes oficiais publicados pelo Ministerio do
              Desenvolvimento Social (MDS) no site gov.br. A gente le os PDFs e
              extrai as informacoes sobre o funcionamento dos sistemas.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-1">
              Posso confiar 100% nessa informacao?
            </h3>
            <p className="text-gray-600 leading-relaxed">
              As informacoes sao extraidas automaticamente dos documentos
              oficiais, mas cada CRAS pode ter suas particularidades. Se voce
              tem duvida, <strong>sempre ligue pro CRAS da sua cidade</strong>{" "}
              antes de ir.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-1">
              Com que frequencia atualiza?
            </h3>
            <p className="text-gray-600 leading-relaxed">
              O sistema verifica novos informes varias vezes ao dia (de manha,
              a tarde e a noite). Quando encontra algo novo, processa e atualiza
              automaticamente.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-1">
              O que sao esses sistemas (SIBEC, CECAD, etc)?
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Sao os sistemas que os funcionarios do CRAS usam pra fazer
              cadastros e consultas. Quando eles estao fora do ar, o CRAS nao
              consegue fazer varios servicos, entao pode nao valer a pena ir
              naquele dia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
