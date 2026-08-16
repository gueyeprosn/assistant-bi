import { prisma } from "@/lib/db";
import { assertSameBusiness } from "@/server/policies";
import { isSlotFree } from "@/lib/calendar";

const OCCUPIED = ["pending", "booked", "reminded"];

export async function bookSlot(opts: {
  businessId: string;
  sessionBusinessId?: string;
  customerId: string;
  serviceId?: string;
  startsAt: Date;
  endsAt: Date;
  notes?: string;
}) {
  if (opts.sessionBusinessId) {
    assertSameBusiness(opts.sessionBusinessId, opts.businessId);
  }
  return prisma.$transaction(async (tx) => {
    const biz = await tx.business.findUnique({ where: { id: opts.businessId } });
    const noticeMin = biz?.minimumNoticeMin ?? 60;
    if (opts.startsAt.getTime() < Date.now() + noticeMin * 60_000) {
      return { ok: false as const, code: "APPOINTMENT_TOO_SOON" };
    }
    const maxPerDay = biz?.maxAppointmentsPerDay ?? 0;
    if (maxPerDay > 0) {
      const dayStart = new Date(opts.startsAt);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const sameDay = await tx.appointment.count({
        where: {
          businessId: opts.businessId,
          status: { in: OCCUPIED },
          startsAt: { gte: dayStart, lt: dayEnd },
        },
      });
      if (sameDay >= maxPerDay) {
        return { ok: false as const, code: "APPOINTMENT_DAY_FULL" };
      }
    }
    const busy = await tx.appointment.findMany({
      where: {
        businessId: opts.businessId,
        status: { in: OCCUPIED },
        startsAt: { lt: opts.endsAt },
        endsAt: { gt: opts.startsAt },
      },
      take: 1,
    });
    const blocked = await tx.blockedSlot.findMany({
      where: {
        businessId: opts.businessId,
        startsAt: { lt: opts.endsAt },
        endsAt: { gt: opts.startsAt },
      },
      take: 1,
    });
    if (busy.length || blocked.length) {
      return { ok: false as const, code: "APPOINTMENT_SLOT_UNAVAILABLE" };
    }
    const free = await isSlotFree(opts.businessId, opts.startsAt, opts.endsAt);
    if (!free) {
      return { ok: false as const, code: "APPOINTMENT_SLOT_UNAVAILABLE" };
    }
    const appointment = await tx.appointment.create({
      data: {
        businessId: opts.businessId,
        customerId: opts.customerId,
        serviceId: opts.serviceId,
        startsAt: opts.startsAt,
        endsAt: opts.endsAt,
        status: "booked",
        confirmedAt: new Date(),
        notes: opts.notes,
      },
    });
    return { ok: true as const, appointment };
  });
}
