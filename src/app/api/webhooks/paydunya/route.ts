import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** IPN PayDunya — activer après KYC. Vérifier la signature en prod. */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const json = form
    ? Object.fromEntries(form.entries())
    : ((await req.json().catch(() => null)) as Record<string, string> | null);
  if (!json) return NextResponse.json({ ok: false }, { status: 400 });

  const paymentId = String(json.paymentId || json["custom_data[paymentId]"] || "");
  const status = String(json.status || json["invoice[status]"] || "");
  if (paymentId && /completed|success/i.test(status)) {
    const payment = await prisma.subscriptionPayment.findUnique({
      where: { id: paymentId },
    });
    if (payment) {
      await prisma.subscriptionPayment.update({
        where: { id: paymentId },
        data: { status: "confirmed", confirmedAt: new Date() },
      });
      await prisma.business.update({
        where: { id: payment.businessId },
        data: { status: "active" },
      });
    }
  }
  return NextResponse.json({ ok: true });
}
