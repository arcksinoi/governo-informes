import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const informes = sqliteTable("informes", {
  id: text("id").primaryKey(),
  numero: text("numero").notNull(),
  titulo: text("titulo").notNull(),
  dataPublicacao: text("data_publicacao"),
  urlOriginal: text("url_original").notNull(),
  conteudoOriginal: text("conteudo_original"),
  conteudoSimplificado: text("conteudo_simplificado"),
  relevancia: text("relevancia", { enum: ["alta", "media", "baixa"] }).default(
    "media"
  ),
  tags: text("tags"), // JSON array as string
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const pdfs = sqliteTable("pdfs", {
  id: text("id").primaryKey(),
  informeId: text("informe_id").references(() => informes.id),
  url: text("url").notNull(),
  nomeArquivo: text("nome_arquivo").notNull(),
  caminhoLocal: text("caminho_local"),
  textoExtraido: text("texto_extraido"),
  processado: integer("processado", { mode: "boolean" }).default(false),
  erro: text("erro"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  informeId: text("informe_id").references(() => informes.id),
  titulo: text("titulo").notNull(),
  conteudo: text("conteudo").notNull(),
  resumo: text("resumo"),
  publicado: integer("publicado", { mode: "boolean" }).default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const crasStatus = sqliteTable("cras_status", {
  id: text("id").primaryKey(),
  data: text("data").notNull(),
  sistemasAtivos: text("sistemas_ativos"), // JSON array as string
  sistemasInativos: text("sistemas_inativos"), // JSON array as string
  motivoInatividade: text("motivo_inatividade"),
  observacoes: text("observacoes"),
  fonteInformeId: text("fonte_informe_id").references(() => informes.id),
  fonteUrl: text("fonte_url"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const emailSubscribers = sqliteTable("email_subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  ativo: integer("ativo", { mode: "boolean" }).default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
