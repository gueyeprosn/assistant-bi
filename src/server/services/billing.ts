import { prisma } from "@/lib/db";
import { writeAudit } from "./audit";
import { planPrice, type PlanId } from "@/lib/plans";

export async function recordSubscriptionEvent(opts: {
  businessId: string;
  type: string;
  actorUserId?: string | null;
  payload?: Record<string, unknown>;
}) {
  await prisma.subscriptionEvent.create({
    data: {
      businessId: opts.businessId,
      type: opts.type,
      actorUserId: opts.actorUserId ?? null,
      payloadJson: JSON.stringify(opts.payload ?? {}),
    },
  });
}

export async function confirmManualPayment(opts: {
  paymentId: string;
  adminUserId: string;
}) {
  const payment = await prisma.subscriptionPayment.findUnique({ where: { id: opts.paymentId } });
  if (!payment || payment.status !== "pending") return { ok: false as const };
  const planId = (["micro", "standard", "pro"].includes(payment.planId)
    ? payment.planId
    : "standard") as Exclude<PlanId, "trial">;
  await prisma.subscriptionPayment.update({
    where: { id: payment.id },
    data: {
      status: "confirmed",
      confirmedAt: new Date(),
      confirmedByUserId: opts.adminUserId,
    },
  });
  await prisma.business.update({
    where: { id: payment.businessId },
    data: { status: "active", plan: planId },
  });
  await recordSubscriptionEvent({
    businessId: payment.businessId,
    type: "payment_confirmed",
    actorUserId: opts.adminUserId,
    payload: { paymentId: payment.id, planId, amount: planPrice(planId) },
  });
  await writeAudit({
    action: "payment_confirm",
    actorUserId: opts.adminUserId,
    businessId: payment.businessId,
    metadata: { paymentId: payment.id, planId },
  });
  return { ok: true as const, planId };
}
