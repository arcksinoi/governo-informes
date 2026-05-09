import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

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
    const informe = db
      .select()
      .from(schema.informes)
      .where(eq(schema.informes.id, id))
      .get();

    if (!informe) {
      return NextResponse.json(
        { error: "Informe nao encontrado" },
        { status: 404 }
      );
    }

    const post = db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.informeId, id))
      .get();

    const pdfs = db
      .select({
        url: schema.pdfs.url,
        nomeArquivo: schema.pdfs.nomeArquivo,
      })
      .from(schema.pdfs)
      .where(eq(schema.pdfs.informeId, id))
      .all();

    return NextResponse.json({
      ...informe,
      tags: informe.tags ? JSON.parse(informe.tags) : [],
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
