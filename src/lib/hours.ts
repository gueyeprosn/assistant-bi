export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS_FR: Record<DayKey, string> = {
  sun: "Dimanche",
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
};

export type HoursMap = Record<DayKey, [string, string][]>;

export const EMPTY_HOURS: HoursMap = {
  sun: [],
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
};

export function parseHours(json: string): HoursMap {
  try {
    const raw = JSON.parse(json) as Partial<HoursMap>;
    return { ...EMPTY_HOURS, ...raw };
  } catch {
    return { ...EMPTY_HOURS };
  }
}

export function hoursToText(hours: HoursMap, lang: "fr" | "wo"): string {
  const lines: string[] = [];
  (["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as DayKey[]).forEach((day) => {
    const slots = hours[day];
    const label = DAY_LABELS_FR[day];
    if (!slots.length) {
      lines.push(lang === "wo" ? `${label} : dafa tëj` : `${label} : fermé`);
    } else {
      const range = slots.map(([a, b]) => `${a.replace(":", "h")} – ${b.replace(":", "h")}`).join(", ");
      lines.push(`${label} : ${range}`);
    }
  });
  return lines.join("\n");
}

export function dayKeyFromDate(d: Date): DayKey {
  return DAY_KEYS[d.getDay()];
}

export function parseHm(hm: string): { h: number; m: number } {
  const [h, m] = hm.split(":").map((n) => parseInt(n, 10));
  return { h, m };
}

export function atTimeOnDate(date: Date, hm: string): Date {
  const { h, m } = parseHm(hm);
  const ymd = date.toLocaleDateString("en-CA", { timeZone: "Africa/Dakar" });
  return new Date(`${ymd}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
}

export function formatHoursCompact(hours: HoursMap): string {
  const groups: { days: DayKey[]; slots: string }[] = [];
  (["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as DayKey[]).forEach((day) => {
    const slotStr = hours[day].length
      ? hours[day].map(([a, b]) => `${a.replace(":", "h")}–${b.replace(":", "h")}`).join(", ")
      : "fermé";
    const last = groups[groups.length - 1];
    if (last && last.slots === slotStr) last.days.push(day);
    else groups.push({ days: [day], slots: slotStr });
  });
  return groups
    .map((g) => {
      const from = DAY_LABELS_FR[g.days[0]];
      const to = DAY_LABELS_FR[g.days[g.days.length - 1]];
      const label = g.days.length === 1 ? from : `${from} – ${to}`;
      return `${label} : ${g.slots}`;
    })
    .join("\n");
}
