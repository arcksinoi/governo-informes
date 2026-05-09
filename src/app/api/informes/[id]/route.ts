import { NextResponse } from "next/server";
import { collections } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/informes/[id] - Get a single informe with its post and PDFs
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const informeDoc = await collections.informes().doc(id).get();

    if (!informeDoc.exists) {
      return NextResponse.json(
        { error: "Informe nao encontrado" },
        { status: 404 }
      );
    }

    const informe = informeDoc.data()!;

    // Get post from subcollection
    const postSnap = await collections.posts(id).limit(1).get();
    const post = postSnap.empty ? null : postSnap.docs[0].data();

    // Get PDFs from subcollection
    const pdfsSnap = await collections.pdfs(id).get();
    const pdfs = pdfsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: data.url,
        nomeArquivo: data.nomeArquivo,
      };
    });

    return NextResponse.json({
      id: informeDoc.id,
      numero: informe.numero,
      titulo: informe.titulo,
      dataPublicacao: informe.dataPublicacao || null,
      urlOriginal: informe.urlOriginal,
      conteudoOriginal: informe.conteudoOriginal,
      conteudoSimplificado: informe.conteudoSimplificado || null,
      relevancia: informe.relevancia,
      tags: informe.tags || [],
      createdAt: informe.createdAt,
      updatedAt: informe.updatedAt,
      post: post
        ? {
            titulo: post.titulo,
            resumo: post.resumo,
            conteudo: post.conteudo,
          }
        : null,
      pdfs,
    });
  } catch (err) {
    console.error("Error getting informe:", err);
    return NextResponse.json(
      { error: "Failed to get informe" },
      { status: 500 }
    );
  }
}
