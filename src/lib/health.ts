import { prisma } from "./db";

export async function checkHealth() {
  await prisma.$queryRaw`SELECT 1`;
  return { ok: true as const, service: "assistant-bi" };
}
