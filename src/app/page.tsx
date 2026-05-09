import InformeCard from "@/components/InformeCard";
import Link from "next/link";
import { collections } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

interface InformeData {
  id: string;
  numero: string;
  titulo: string;
  dataPublicacao: string | null;
  urlOriginal: string;
  relevancia: string | null;
  tags: string[];
  createdAt: string;
  post: {
    titulo: string;
    resumo: string | null;
    conteudo: string;
  } | null;
}

async function getInformes(): Promise<InformeData[]> {
  try {
    const snapshot = await collections
      .informes()
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const informes = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();

        // Get post from subcollection
        const postSnap = await collections.posts(doc.id).limit(1).get();
        const post = postSnap.empty ? null : postSnap.docs[0].data();

        return {
          id: doc.id,
          numero: data.numero,
          titulo: data.titulo,
          dataPublicacao: data.dataPublicacao || null,
          urlOriginal: data.urlOriginal,
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
        };
      })
    );

    return informes;
  } catch (err) {
    console.error("Error fetching informes:", err);
    return [];
  }
}

async function getCrasStatus() {
  try {
    const statusSnap = await collections
      .crasStatus()
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (statusSnap.empty) return null;

    const data = statusSnap.docs[0].data();
    const sistemasAtivos: string[] = data.sistemasAtivos || [];
    const sistemasInativos: string[] = data.sistemasInativos || [];

    let status: string;
    let mensagem: string;

    if (sistemasInativos.length === 0 && sistemasAtivos.length > 0) {
      status = "pode_ir";
      mensagem =
        "Ta tudo funcionando! Pode ir ao CRAS resolver o que precisar.";
    } else if (sistemasInativos.length > 0 && sistemasAtivos.length === 0) {
      status = "nao_ir";
      mensagem =
        "Os sistemas do CadUnico estao fora do ar hoje. Melhor ir outro dia.";
    } else if (sistemasInativos.length > 0) {
      status = "cautela";
      mensagem =
        "Alguns sistemas estao com problema. Ligue pro CRAS antes de ir.";
    } else {
      status = "sem_dados";
      mensagem = "Nao temos certeza se esta tudo funcionando. Ligue pro CRAS.";
    }

    return { status, mensagem };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [informes, crasStatus] = await Promise.all([
    getInformes(),
    getCrasStatus(),
  ]);

  const crasStatusColor: Record<string, string> = {
    pode_ir: "bg-green-50 border-green-300 text-green-800",
    nao_ir: "bg-red-50 border-red-300 text-red-800",
    cautela: "bg-amber-50 border-amber-300 text-amber-800",
    sem_dados: "bg-gray-50 border-gray-300 text-gray-600",
  };

  const crasEmoji: Record<string, string> = {
    pode_ir: "✅",
    nao_ir: "❌",
    cautela: "⚠️",
    sem_dados: "❓",
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Titulo - simples e direto */}
      <section className="text-center py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Novidades do CadUnico
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Aqui a gente pega as informacoes do governo e explica de um jeito
          facil de entender. Tudo sobre o Cadastro Unico e programas sociais.
        </p>
      </section>

      {/* CRAS - botao grande e claro */}
      {crasStatus && (
        <Link href="/cras-hoje" className="block min-h-0">
          <div
            className={`rounded-xl border-2 p-4 sm:p-5 flex items-center gap-4 hover:shadow-md active:shadow-sm transition-shadow ${
              crasStatusColor[crasStatus.status] || crasStatusColor.sem_dados
            }`}
          >
            <div className="text-3xl sm:text-4xl flex-shrink-0">
              {crasEmoji[crasStatus.status] || "❓"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base sm:text-lg">
                Posso ir no CRAS hoje?
              </h2>
              <p className="text-xs sm:text-sm mt-0.5 leading-relaxed">
                {crasStatus.mensagem}
              </p>
            </div>
            <span className="text-sm font-medium opacity-70 flex-shrink-0 hidden sm:block">
              Ver mais →
            </span>
          </div>
        </Link>
      )}

      {/* Lista de informes */}
      {informes.length > 0 ? (
        <section>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
            Ultimas noticias do CadUnico
          </h2>
          <div className="grid gap-4">
            {informes.map((informe) => (
              <InformeCard
                key={informe.id}
                id={informe.id}
                numero={informe.numero}
                titulo={informe.post?.titulo || informe.titulo}
                resumo={informe.post?.resumo || null}
                conteudo={informe.post?.conteudo || null}
                relevancia={informe.relevancia}
                tags={informe.tags}
                urlOriginal={informe.urlOriginal}
                createdAt={informe.createdAt}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="text-center py-12 sm:py-16">
          <div className="text-5xl sm:text-6xl mb-4">📋</div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">
            Ainda sem noticias
          </h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">
            O sistema ainda ta buscando as informacoes. Em breve vai aparecer
            tudo aqui.
          </p>
        </section>
      )}

      {/* Como funciona - linguagem super simples */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Como funciona esse site?
        </h2>
        <div className="space-y-4 text-sm sm:text-base text-gray-600">
          <div className="flex gap-3">
            <div className="text-2xl flex-shrink-0">🔍</div>
            <div>
              <strong className="text-gray-800 block mb-0.5">
                1. A gente busca as informacoes
              </strong>
              <p className="leading-relaxed">
                Todo dia o sistema vai no site oficial do governo e pega os
                documentos novos sobre o CadUnico.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-2xl flex-shrink-0">📖</div>
            <div>
              <strong className="text-gray-800 block mb-0.5">
                2. A gente traduz pra voce
              </strong>
              <p className="leading-relaxed">
                Os documentos do governo sao complicados. A gente le tudo e
                escreve de novo, de um jeito que qualquer pessoa entende.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-2xl flex-shrink-0">📱</div>
            <div>
              <strong className="text-gray-800 block mb-0.5">
                3. Voce fica sabendo de tudo
              </strong>
              <p className="leading-relaxed">
                Aqui voce ve o que mudou, o que ta funcionando e o que pode
                afetar o seu beneficio ou cadastro.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
