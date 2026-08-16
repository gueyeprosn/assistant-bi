import { prisma } from "@/lib/db";

export async function writeAudit(opts: {
  action: string;
  actorUserId?: string | null;
  businessId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: opts.action,
        actorUserId: opts.actorUserId ?? null,
        businessId: opts.businessId ?? null,
        metadataJson: JSON.stringify(opts.metadata ?? {}),
      },
    });
  } catch (error) {
    console.error("[audit]", error);
  }
}
