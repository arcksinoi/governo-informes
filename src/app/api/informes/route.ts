import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

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
  const offset = (page - 1) * limit;

  try {
    let query = db
      .select({
        id: schema.informes.id,
        numero: schema.informes.numero,
        titulo: schema.informes.titulo,
        dataPublicacao: schema.informes.dataPublicacao,
        urlOriginal: schema.informes.urlOriginal,
        relevancia: schema.informes.relevancia,
        tags: schema.informes.tags,
        createdAt: schema.informes.createdAt,
      })
      .from(schema.informes)
      .orderBy(desc(schema.informes.createdAt))
      .limit(limit)
      .offset(offset);

    const informes = query.all();

    // Get posts for each informe
    const informesWithPosts = informes.map((informe) => {
      const post = db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.informeId, informe.id))
        .get();

      return {
        ...informe,
        tags: informe.tags ? JSON.parse(informe.tags) : [],
        post: post
          ? {
              titulo: post.titulo,
              resumo: post.resumo,
              conteudo: post.conteudo,
            }
          : null,
      };
    });

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
