import { NextResponse } from "next/server";
import { collections } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/informes/cras-status - Get current CRAS status
 */
export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Get latest CRAS status
    const statusSnap = await collections
      .crasStatus()
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (statusSnap.empty) {
      return NextResponse.json({
        status: "sem_dados",
        mensagem:
          "Ainda nao temos dados sobre o funcionamento dos sistemas hoje. Consulte seu CRAS diretamente.",
        data: today,
        sistemasAtivos: [],
        sistemasInativos: [],
        motivoInatividade: null,
        observacoes: null,
        fonteUrl: null,
        ultimaAtualizacao: null,
      });
    }

    const latestStatus = statusSnap.docs[0].data();

    const sistemasAtivos: string[] = latestStatus.sistemasAtivos || [];
    const sistemasInativos: string[] = latestStatus.sistemasInativos || [];

    let status: "pode_ir" | "nao_ir" | "cautela" | "sem_dados";
    let mensagem: string;

    if (sistemasInativos.length === 0 && sistemasAtivos.length > 0) {
      status = "pode_ir";
      mensagem =
        "Pode ir sim, compadre! Os sistemas tao funcionando direitinho.";
    } else if (sistemasInativos.length > 0 && sistemasAtivos.length === 0) {
      status = "nao_ir";
      mensagem = `Eita, melhor nao ir hoje nao, viu? Os sistemas (${sistemasInativos.join(", ")}) tao fora do ar.`;
    } else if (sistemasInativos.length > 0) {
      status = "cautela";
      mensagem = `Oxe, cuidado! Alguns sistemas tao com problema: ${sistemasInativos.join(", ")}. Mas ${sistemasAtivos.join(", ")} tao funcionando. Melhor ligar pro CRAS antes de ir.`;
    } else {
      status = "sem_dados";
      mensagem =
        "Num tenho certeza se ta tudo funcionando. Melhor ligar pro seu CRAS antes de ir, viu?";
    }

    return NextResponse.json({
      status,
      mensagem,
      data: today,
      sistemasAtivos,
      sistemasInativos,
      motivoInatividade: latestStatus.motivoInatividade || null,
      observacoes: latestStatus.observacoes || null,
      fonteUrl: latestStatus.fonteUrl || null,
      ultimaAtualizacao: latestStatus.createdAt || null,
    });
  } catch (err) {
    console.error("Error getting CRAS status:", err);
    return NextResponse.json(
      { error: "Failed to get CRAS status" },
      { status: 500 }
    );
  }
}
