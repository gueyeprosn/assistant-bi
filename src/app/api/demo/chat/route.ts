import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleInbound } from "@/lib/bot/engine";
import { normalizeSnPhone } from "@/lib/phone";

const schema = z.object({
  slug: z.string().min(1),
  phone: z.string().min(8),
  text: z.string().min(1).max(2000),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "TEXT_REQUIRED", message: "Requête invalide" } },
      { status: 400 },
    );
  }
  const business = await prisma.business.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (!business) {
    return NextResponse.json(
      { success: false, error: { code: "BUSINESS_NOT_FOUND", message: "Commerce introuvable" } },
      { status: 404 },
    );
  }
  if (business.status === "suspended") {
    return NextResponse.json(
      { success: false, error: { code: "BUSINESS_SUSPENDED", message: "Commerce suspendu" } },
      { status: 403 },
    );
  }
  const result = await handleInbound({
    businessId: business.id,
    customerPhone: normalizeSnPhone(parsed.data.phone),
    customerName: parsed.data.name,
    text: parsed.data.text,
  });
  return NextResponse.json({ success: true, ...result });
}
