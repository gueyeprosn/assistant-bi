import { formatFcfa } from "./format";

export type QuoteLine = { name: string; qty: number; priceFcfa: number };

export type QuoteDraftLine = {
  serviceId?: string;
  name: string;
  qty: number;
  priceFcfa: number;
  saveService?: boolean;
};

const MAX_LINES = 20;
const MAX_QTY = 99;
const MAX_PRICE = 10_000_000;

export function clampQuoteQty(n: number) {
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_QTY, Math.max(1, Math.round(n)));
}

export function parseQuoteDraft(raw: string): { ok: true; lines: QuoteDraftLine[] } | { ok: false } {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false };
  }
  if (!Array.isArray(data) || data.length === 0 || data.length > MAX_LINES) return { ok: false };
  const lines: QuoteDraftLine[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") return { ok: false };
    const rec = item as Record<string, unknown>;
    const qty = clampQuoteQty(Number(rec.qty));
    const serviceId = typeof rec.serviceId === "string" ? rec.serviceId.trim().slice(0, 64) : "";
    const name = typeof rec.name === "string" ? rec.name.trim().slice(0, 80) : "";
    const priceFcfa = Math.round(Number(rec.priceFcfa));
    const saveService = rec.saveService === true;
    if (serviceId) {
      lines.push({ serviceId, name, qty, priceFcfa: 0, saveService: false });
      continue;
    }
    if (name && Number.isFinite(priceFcfa) && priceFcfa >= 0 && priceFcfa <= MAX_PRICE) {
      lines.push({ name, qty, priceFcfa, saveService });
      continue;
    }
    return { ok: false };
  }
  return { ok: true, lines };
}

export function parseStoredQuoteLines(raw: string): QuoteLine[] {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const rec = item as Record<string, unknown>;
        const name = typeof rec.name === "string" ? rec.name : "";
        const qty = clampQuoteQty(Number(rec.qty) || 1);
        const priceFcfa = Math.round(Number(rec.priceFcfa) || 0);
        if (!name) return null;
        return { name, qty, priceFcfa };
      })
      .filter((l): l is QuoteLine => Boolean(l));
  } catch {
    return [];
  }
}

export function buildQuoteText(opts: {
  businessName: string;
  customerName?: string | null;
  lines: QuoteLine[];
  lang: "fr" | "wo";
  note?: string;
}): { text: string; total: number } {
  const total = opts.lines.reduce((s, l) => s + l.qty * l.priceFcfa, 0);
  const header = `Devis — ${opts.businessName}`;
  const who = opts.customerName ? `\nClient : ${opts.customerName}` : "";
  const body = opts.lines
    .map((l) =>
      l.qty > 1
        ? `• ${l.name} × ${l.qty} — ${formatFcfa(l.qty * l.priceFcfa)}`
        : `• ${l.name} — ${formatFcfa(l.priceFcfa)}`,
    )
    .join("\n");
  const footer =
    opts.lang === "wo"
      ? `\nTotal : ${formatFcfa(total)}\nDafa am 7 jours.\nTegal WA AW si nga bëgg a jël rendez-vous.`
      : `\nTotal : ${formatFcfa(total)}\nValable 7 jours.\nRépondez OUI pour réserver un créneau, ou demandez le patron pour ajuster.`;
  const note = opts.note?.trim() ? `\n${opts.note.trim()}` : "";
  return { text: `${header}${who}\n———\n${body}\n———${footer}${note}`, total };
}
