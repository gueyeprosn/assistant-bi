import { execSync } from "node:child_process";
import { isPostgresUrl, migrateDatabaseUrl, resolveDatabaseUrl } from "./db-url.mjs";

const url = resolveDatabaseUrl();
if (!isPostgresUrl(url)) {
  console.log("[db] skip schema sync (pas PostgreSQL)");
  process.exit(0);
}
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = url;

const pushUrl = migrateDatabaseUrl(url);
console.log("[db] prisma db push");
execSync("npx prisma db push --skip-generate", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: pushUrl },
});

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();
try {
  const n = await prisma.user.count();
  if (n === 0) {
    console.log("[db] base vide — comptes démo");
    execSync("npx tsx prisma/seed.ts", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url },
    });
  } else {
    console.log(`[db] ${n} utilisateur(s) déjà en base`);
  }
} finally {
  await prisma.$disconnect();
}
