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
    pode_ir: "bg-green-100 border-green-300 text-green-800",
    nao_ir: "bg-red-100 border-red-300 text-red-800",
    cautela: "bg-amber-100 border-amber-300 text-amber-800",
    sem_dados: "bg-gray-100 border-gray-300 text-gray-600",
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Informes do CadUnico
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Aqui a gente traduz os informes do governo pra uma linguagem que todo
          mundo entende. Sem enrolacao, direto ao ponto.
        </p>
      </section>

      {/* CRAS Quick Status */}
      {crasStatus && (
        <Link href="/cras-hoje" className="block">
          <div
            className={`rounded-xl border-2 p-5 flex flex-col sm:flex-row items-center gap-4 hover:shadow-md transition-shadow ${
              crasStatusColor[crasStatus.status] || crasStatusColor.sem_dados
            }`}
          >
            <div className="text-4xl">
              {crasStatus.status === "pode_ir" && "✅"}
              {crasStatus.status === "nao_ir" && "❌"}
              {crasStatus.status === "cautela" && "⚠️"}
              {crasStatus.status === "sem_dados" && "❓"}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="font-bold text-lg">Ir no CRAS hoje?</h2>
              <p className="text-sm mt-0.5">{crasStatus.mensagem}</p>
            </div>
            <span className="text-sm font-medium opacity-70">
              Ver detalhes &rarr;
            </span>
          </div>
        </Link>
      )}

      {/* Informes List */}
      {informes.length > 0 ? (
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Ultimos Informes
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
        <section className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            Ainda sem informes
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            O sistema ainda ta coletando as informacoes. Em breve vai aparecer
            tudo aqui, bonitinho e facil de entender.
          </p>
          <p className="text-sm text-gray-400 mt-4">
            O scraper roda automaticamente varias vezes ao dia.
          </p>
        </section>
      )}

      {/* About Section */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mt-8">
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          Como funciona?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex gap-3">
            <div className="text-2xl">🔍</div>
            <div>
              <strong className="text-gray-800">Coleta</strong>
              <p>
                O sistema busca automaticamente novos informes no site oficial
                do MDS (gov.br) diariamente.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-2xl">🤖</div>
            <div>
              <strong className="text-gray-800">Simplifica</strong>
              <p>
                Uma inteligencia artificial le os PDFs e reescreve tudo em
                linguagem simples, como a gente conversa no dia a dia.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-2xl">📱</div>
            <div>
              <strong className="text-gray-800">Informa</strong>
              <p>
                Voce recebe as informacoes mais importantes de um jeito facil
                de ler, sempre com a fonte original.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
