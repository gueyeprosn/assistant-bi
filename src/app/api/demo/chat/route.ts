import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleInbound } from "@/lib/bot/engine";
import { normalizeSnPhone } from "@/lib/phone";
import { errorJson, limitedJson } from "@/lib/http";

const schema = z.object({
  slug: z.string().min(1),
  phone: z.string().min(8),
  text: z.string().min(1).max(2000),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const limited = limitedJson(`demo:${req.headers.get("x-forwarded-for") || "local"}`, 60, 60_000);
  if (limited) return limited;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorJson("VALIDATION_ERROR");
  const business = await prisma.business.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (!business) return errorJson("BUSINESS_NOT_FOUND");
  if (business.status === "suspended" || business.status === "cancelled") return errorJson("BUSINESS_SUSPENDED");
  const result = await handleInbound({
    businessId: business.id,
    customerPhone: normalizeSnPhone(parsed.data.phone),
    customerName: parsed.data.name,
    text: parsed.data.text,
  });
  return NextResponse.json({ success: true, ...result });
}
