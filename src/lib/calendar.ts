import { prisma } from "./db";
import { addDays, toYmd } from "./format";
import {
  atTimeOnDate,
  dayKeyFromDate,
  parseHours,
  parseHm,
  type HoursMap,
} from "./hours";

export type Slot = { start: Date; end: Date };

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export async function getBusyRanges(businessId: string, from: Date, to: Date) {
  const [appointments, blocked] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        businessId,
        status: { in: ["booked", "reminded"] },
        startsAt: { lt: to },
        endsAt: { gt: from },
      },
    }),
    prisma.blockedSlot.findMany({
      where: {
        businessId,
        startsAt: { lt: to },
        endsAt: { gt: from },
      },
    }),
  ]);
  return [
    ...appointments.map((a) => ({ start: a.startsAt, end: a.endsAt })),
    ...blocked.map((b) => ({ start: b.startsAt, end: b.endsAt })),
  ];
}

function generateDaySlots(
  day: Date,
  hours: HoursMap,
  stepMin: number,
  durationMin: number,
  now: Date,
): Slot[] {
  const key = dayKeyFromDate(day);
  const windows = hours[key];
  const slots: Slot[] = [];
  for (const [open, close] of windows) {
    const windowStart = atTimeOnDate(day, open);
    const { h: ch, m: cm } = parseHm(close);
    const ymd = toYmd(day);
    const windowEnd = new Date(
      `${ymd}T${String(ch).padStart(2, "0")}:${String(cm).padStart(2, "0")}:00`,
    );
    for (
      let t = windowStart.getTime();
      t + durationMin * 60_000 <= windowEnd.getTime();
      t += stepMin * 60_000
    ) {
      const start = new Date(t);
      const end = new Date(t + durationMin * 60_000);
      if (start <= now) continue;
      slots.push({ start, end });
    }
  }
  return slots;
}

export async function findAvailableSlots(opts: {
  businessId: string;
  hoursJson: string;
  slotStepMin: number;
  durationMin: number;
  from?: Date;
  days?: number;
  limit?: number;
}): Promise<Slot[]> {
  const now = new Date();
  const from = opts.from && opts.from > now ? opts.from : now;
  const days = opts.days ?? 14;
  const limit = opts.limit ?? 8;
  const hours = parseHours(opts.hoursJson);
  const rangeEnd = addDays(from, days);
  const busy = await getBusyRanges(opts.businessId, from, rangeEnd);
  const found: Slot[] = [];
  for (let i = 0; i < days && found.length < limit; i++) {
    const day = addDays(startOfLocalDay(from), i);
    const candidates = generateDaySlots(
      day,
      hours,
      opts.slotStepMin,
      opts.durationMin,
      now,
    );
    for (const slot of candidates) {
      if (slot.start < from) continue;
      const taken = busy.some((b) => overlaps(slot.start, slot.end, b.start, b.end));
      if (!taken) {
        found.push(slot);
        if (found.length >= limit) break;
      }
    }
  }
  return found;
}

function startOfLocalDay(d: Date): Date {
  const ymd = toYmd(d);
  return new Date(`${ymd}T00:00:00`);
}

export async function isSlotFree(
  businessId: string,
  start: Date,
  end: Date,
): Promise<boolean> {
  const busy = await getBusyRanges(businessId, start, end);
  return !busy.some((b) => overlaps(start, end, b.start, b.end));
}

export async function countAppointmentsThisMonth(businessId: string): Promise<number> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return prisma.appointment.count({
    where: {
      businessId,
      createdAt: { gte: start, lt: end },
      status: { not: "cancelled" },
    },
  });
}
