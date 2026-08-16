import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isPostgresUrl, resolveDatabaseUrl } from "./db-url.mjs";

const url = resolveDatabaseUrl();
if (url && !process.env.DATABASE_URL) process.env.DATABASE_URL = url;

const provider = isPostgresUrl(url) ? "postgresql" : "sqlite";
const schemaPath = resolve("prisma/schema.prisma");
const schema = readFileSync(schemaPath, "utf8");
const next = schema.replace(
  /(datasource db \{[\s\S]*?provider\s*=\s*")[^"]+(")/,
  `$1${provider}$2`,
);

if (next !== schema) writeFileSync(schemaPath, next);
console.log(`[prisma] provider=${provider}`);

if (process.env.VERCEL === "1" && provider !== "postgresql") {
  console.error(
    "[db] Vercel n’accepte pas SQLite. Créez une base Neon (Vercel → Storage → Neon) et définissez DATABASE_URL=postgresql://…",
  );
  process.exit(1);
}
