import { addDays, toYmd } from "../format";

const DAYS_FR: Record<string, number> = {
  dimanche: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
};

export function parseWhen(text: string, now = new Date()): { date?: Date; time?: string } {
  const t = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  let date: Date | undefined;
  if (/\baujourd.?hui\b|\btey\b/.test(t)) date = now;
  else if (/\bdemain\b|\bsuba\b/.test(t)) date = addDays(now, 1);
  else if (/apr[eè]s[-\s]?demain|ginaaw suba/.test(t)) date = addDays(now, 2);
  else {
    for (const [name, idx] of Object.entries(DAYS_FR)) {
      if (t.includes(name)) {
        const cur = now.getDay();
        let delta = (idx - cur + 7) % 7;
        if (delta === 0) delta = 7;
        date = addDays(now, delta);
        break;
      }
    }
  }

  const m =
    t.match(/\b(\d{1,2})\s*h\s*(\d{2})?\b/) ||
    t.match(/\b(\d{1,2}):(\d{2})\b/) ||
    t.match(/\b(\d{1,2})\s*heures?\b/);
  let time: string | undefined;
  if (m) {
    const h = Math.min(23, parseInt(m[1], 10));
    const min = m[2] ? parseInt(m[2], 10) : 0;
    time = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  if (date) {
    const ymd = toYmd(date);
    date = new Date(`${ymd}T00:00:00`);
  }
  return { date, time };
}
