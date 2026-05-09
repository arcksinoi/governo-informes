import { NextResponse } from "next/server";
import { collections } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/informes - List all informes with pagination
 * Query params: ?page=1&limit=10&relevancia=alta
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const relevancia = searchParams.get("relevancia");

  try {
    let query = collections
      .informes()
      .orderBy("createdAt", "desc")
      .limit(limit);

    // Firestore offset (skips documents — works but charges for skipped reads)
    if (page > 1) {
      query = query.offset((page - 1) * limit);
    }

    const snapshot = await query.get();

    const informesWithPosts = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const informe = doc.data();

        // Get post from subcollection
        const postSnap = await collections
          .posts(doc.id)
          .limit(1)
          .get();

        const post = postSnap.empty
          ? null
          : postSnap.docs[0].data();

        return {
          id: doc.id,
          numero: informe.numero,
          titulo: informe.titulo,
          dataPublicacao: informe.dataPublicacao || null,
          urlOriginal: informe.urlOriginal,
          relevancia: informe.relevancia,
          tags: informe.tags || [],
          createdAt: informe.createdAt,
          post: post
            ? {
                titulo: post.titulo,
                resumo: post.resumo,
                conteudo: post.conteudo,
              }
            : null,
        };
      })
    );

    // Filter by relevancia if specified
    const filtered = relevancia
      ? informesWithPosts.filter((i) => i.relevancia === relevancia)
      : informesWithPosts;

    return NextResponse.json({
      informes: filtered,
      page,
      limit,
      total: filtered.length,
    });
  } catch (err) {
    console.error("Error listing informes:", err);
    return NextResponse.json(
      { error: "Failed to list informes" },
      { status: 500 }
    );
  }
}
