import CrasStatusComponent from "@/components/CrasStatus";
import Link from "next/link";
import { collections } from "@/lib/firebase/admin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Posso ir no CRAS hoje? - Compadre do CadUnico",
  description:
    "Descubra se o CRAS esta atendendo hoje antes de sair de casa. Informacao simples e direta.",
};

export const dynamic = "force-dynamic";

async function getCrasStatus() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const statusSnap = await collections
      .crasStatus()
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (statusSnap.empty) {
      return {
        status: "sem_dados" as const,
        mensagem:
          "Ainda nao temos informacoes sobre o CRAS hoje. Ligue pro CRAS da sua cidade pra saber se esta atendendo.",
        data: today,
        sistemasInativos: [] as string[],
        motivoInatividade: null,
        observacoes: null,
        fonteUrl: null,
        ultimaAtualizacao: null,
      };
    }

    const latestStatus = statusSnap.docs[0].data();
    const sistemasAtivos: string[] = latestStatus.sistemasAtivos || [];
    const sistemasInativos: string[] = latestStatus.sistemasInativos || [];

    let status: "pode_ir" | "nao_ir" | "cautela" | "sem_dados";
    let mensagem: string;

    if (sistemasInativos.length === 0 && sistemasAtivos.length > 0) {
      status = "pode_ir";
      mensagem =
        "Ta tudo funcionando direitinho! Pode ir ao CRAS fazer seu cadastro ou resolver o que precisar do CadUnico.";
    } else if (sistemasInativos.length > 0 && sistemasAtivos.length === 0) {
      status = "nao_ir";
      mensagem =
        "Os sistemas que o CRAS usa pra mexer no CadUnico estao fora do ar hoje. Se voce precisa fazer cadastro, atualizar dados ou consultar beneficios, melhor ir outro dia.";
    } else if (sistemasInativos.length > 0) {
      status = "cautela";
      mensagem =
        "Alguns sistemas do CadUnico estao com problema. O CRAS pode nao conseguir fazer tudo que voce precisa hoje. Ligue antes pra confirmar.";
    } else {
      status = "sem_dados";
      mensagem =
        "Nao temos certeza se esta tudo funcionando hoje. Melhor ligar pro CRAS da sua cidade antes de ir.";
    }

    return {
      status,
      mensagem,
      data: today,
      sistemasInativos,
      motivoInatividade: latestStatus.motivoInatividade || null,
      observacoes: latestStatus.observacoes || null,
      fonteUrl: latestStatus.fonteUrl || null,
      ultimaAtualizacao: latestStatus.createdAt || null,
    };
  } catch (err) {
    console.error("Error fetching CRAS status:", err);
    return {
      status: "sem_dados" as const,
      mensagem:
        "Nao conseguimos buscar as informacoes agora. Tente de novo mais tarde ou ligue pro CRAS da sua cidade.",
      data: new Date().toISOString().split("T")[0],
      sistemasInativos: [] as string[],
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

      {/* Titulo simples */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Posso ir no CRAS hoje?
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Veja se o CRAS consegue resolver coisas do CadUnico hoje antes de
          voce sair de casa.
        </p>
      </div>

      <CrasStatusComponent
        status={crasStatus.status}
        mensagem={crasStatus.mensagem}
        data={crasStatus.data}
        sistemasInativos={crasStatus.sistemasInativos}
        motivoInatividade={crasStatus.motivoInatividade}
        observacoes={crasStatus.observacoes}
        fonteUrl={crasStatus.fonteUrl}
        ultimaAtualizacao={crasStatus.ultimaAtualizacao}
      />

      {/* O que e o CRAS - explicacao simples */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Entenda melhor
        </h2>
        <div className="space-y-5 text-sm sm:text-base">
          <div>
            <h3 className="font-bold text-gray-700 mb-1.5">
              🏢 O que e o CRAS?
            </h3>
            <p className="text-gray-600 leading-relaxed">
              O CRAS e o lugar onde voce vai pra se cadastrar no CadUnico,
              atualizar seus dados e resolver coisas dos programas do governo,
              como o Bolsa Familia. Toda cidade tem pelo menos um CRAS.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-gray-700 mb-1.5">
              📋 O que e o CadUnico?
            </h3>
            <p className="text-gray-600 leading-relaxed">
              O Cadastro Unico (CadUnico) e onde o governo guarda as
              informacoes das familias que precisam de ajuda. Quem ta cadastrado
              pode receber beneficios como Bolsa Familia, tarifa social de luz,
              entre outros.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-gray-700 mb-1.5">
              🖥️ Por que os sistemas importam?
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Os funcionarios do CRAS usam computadores e sistemas pra fazer os
              cadastros e consultas. Quando esses sistemas estao com problema, o
              CRAS nao consegue mexer no CadUnico. Mas outros atendimentos da
              assistencia social continuam normais.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-gray-700 mb-1.5">
              🔄 Essa informacao ta atualizada?
            </h3>
            <p className="text-gray-600 leading-relaxed">
              A gente atualiza todo dia com base nos informes oficiais do
              governo. Mas cada cidade pode ter suas regras. Na duvida,{" "}
              <strong>ligue pro CRAS antes de ir</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
