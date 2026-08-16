/** Résout l’URL Postgres (Vercel/Neon ont plusieurs noms de variables). */

export function resolveDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
  );
}

export function isPostgresUrl(url) {
  return /^(postgres|postgresql):/i.test(url);
}

export function migrateDatabaseUrl(url) {
  return (
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_DIRECT ||
    url
  );
}
