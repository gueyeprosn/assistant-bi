import { prisma } from "./db";

const ARCHIVE_MONTHS = 12;
const ARCHIVE_PLACEHOLDER = "[archivé]";

export function monthsAgo(from: Date, months: number): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() - months);
  return d;
}

export async function archiveOldConversations(now = new Date()) {
  const cutoff = monthsAgo(now, ARCHIVE_MONTHS);
  const stale = await prisma.conversation.findMany({
    where: {
      createdAt: { lt: cutoff },
      status: { not: "archived" },
    },
    select: { id: true },
    take: 500,
  });
  if (stale.length === 0) return 0;
  const ids = stale.map((c) => c.id);
  await prisma.$transaction([
    prisma.message.updateMany({
      where: { conversationId: { in: ids } },
      data: { text: ARCHIVE_PLACEHOLDER },
    }),
    prisma.conversation.updateMany({
      where: { id: { in: ids } },
      data: { status: "archived", summary: null, stateJson: "{}" },
    }),
  ]);
  return ids.length;
}

export async function purgeDueBusinesses(now = new Date()) {
  const due = await prisma.business.findMany({
    where: {
      status: "cancelled",
      purgedAt: null,
      purgeAfter: { lte: now },
    },
    include: { users: true },
    take: 50,
  });

  let purged = 0;
  for (const biz of due) {
    await prisma.$transaction(async (tx) => {
      await tx.impersonationSession.deleteMany({ where: { businessId: biz.id } });
      await tx.session.deleteMany({ where: { businessId: biz.id } });
      await tx.conversation.deleteMany({ where: { businessId: biz.id } });
      await tx.customer.deleteMany({ where: { businessId: biz.id } });
      await tx.service.deleteMany({ where: { businessId: biz.id } });
      await tx.blockedSlot.deleteMany({ where: { businessId: biz.id } });
      for (const user of biz.users) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            name: "Supprimé",
            phone: `purged-${user.id}`,
          },
        });
        await tx.session.deleteMany({ where: { userId: user.id } });
      }
      await tx.business.update({
        where: { id: biz.id },
        data: {
          name: "Compte supprimé",
          address: "—",
          neighborhood: "—",
          greetingFr: "",
          greetingWo: "",
          hoursJson: "{}",
          ownerPhone: "purged",
          waveNumber: null,
          orangeMoneyNumber: null,
          purgedAt: now,
        },
      });
    });
    purged += 1;
  }
  return purged;
}

export async function runRetention(now = new Date()) {
  const archived = await archiveOldConversations(now);
  const purged = await purgeDueBusinesses(now);
  return { archived, purged };
}
