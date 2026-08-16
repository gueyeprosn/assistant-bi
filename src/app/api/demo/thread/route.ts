import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeSnPhone } from "@/lib/phone";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") || "";
  const phone = normalizeSnPhone(req.nextUrl.searchParams.get("phone") || "");
  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return NextResponse.json({ messages: [] });
  const customer = await prisma.customer.findUnique({
    where: { businessId_phone: { businessId: business.id, phone } },
  });
  if (!customer) return NextResponse.json({ messages: [] });
  const conv = await prisma.conversation.findFirst({
    where: { businessId: business.id, customerId: customer.id },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 80 } },
  });
  return NextResponse.json({
    conversationId: conv?.id,
    status: conv?.status,
    messages:
      conv?.messages.map((m) => ({
        id: m.id,
        direction: m.direction,
        text: m.text,
        createdAt: m.createdAt,
      })) ?? [],
  });
}
