import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const businesses = await prisma.business.findMany({
    where: { status: { not: "suspended" } },
    select: { slug: true, name: true, neighborhood: true, category: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ businesses });
}
