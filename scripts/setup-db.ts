import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

/**
 * Setup script: Creates database tables if they don't exist.
 * Run with: npx tsx scripts/setup-db.ts
 */

const DB_PATH = path.join(process.cwd(), "data", "governo-informes.db");
const dataDir = path.dirname(DB_PATH);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("Created data/ directory");
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS informes (
    id TEXT PRIMARY KEY,
    numero TEXT NOT NULL,
    titulo TEXT NOT NULL,
    data_publicacao TEXT,
    url_original TEXT NOT NULL,
    conteudo_original TEXT,
    conteudo_simplificado TEXT,
    relevancia TEXT DEFAULT 'media',
    tags TEXT DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pdfs (
    id TEXT PRIMARY KEY,
    informe_id TEXT REFERENCES informes(id),
    url TEXT NOT NULL,
    nome_arquivo TEXT NOT NULL,
    caminho_local TEXT,
    texto_extraido TEXT,
    processado INTEGER DEFAULT 0,
    erro TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    informe_id TEXT REFERENCES informes(id),
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    resumo TEXT,
    publicado INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cras_status (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    sistemas_ativos TEXT DEFAULT '[]',
    sistemas_inativos TEXT DEFAULT '[]',
    motivo_inatividade TEXT,
    observacoes TEXT,
    fonte_informe_id TEXT REFERENCES informes(id),
    fonte_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS email_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_informes_numero ON informes(numero);
  CREATE INDEX IF NOT EXISTS idx_informes_created ON informes(created_at);
  CREATE INDEX IF NOT EXISTS idx_posts_informe ON posts(informe_id);
  CREATE INDEX IF NOT EXISTS idx_pdfs_informe ON pdfs(informe_id);
  CREATE INDEX IF NOT EXISTS idx_cras_data ON cras_status(data);
`);

console.log("Database setup complete!");
console.log(`Database path: ${DB_PATH}`);

// Verify tables
const tables = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all();
console.log(
  "Tables created:",
  tables.map((t: any) => t.name)
);

sqlite.close();
