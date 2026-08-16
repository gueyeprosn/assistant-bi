import { formatFcfa } from "./format";

export type QuoteLine = { name: string; qty: number; priceFcfa: number };

export function buildQuoteText(opts: {
  businessName: string;
  customerName?: string | null;
  lines: QuoteLine[];
  lang: "fr" | "wo";
}): { text: string; total: number } {
  const total = opts.lines.reduce((s, l) => s + l.qty * l.priceFcfa, 0);
  const header =
    opts.lang === "wo"
      ? `Devis — ${opts.businessName}`
      : `Devis — ${opts.businessName}`;
  const who = opts.customerName ? `\nClient : ${opts.customerName}` : "";
  const body = opts.lines
    .map((l) => `• ${l.name} × ${l.qty} — ${formatFcfa(l.qty * l.priceFcfa)}`)
    .join("\n");
  const footer =
    opts.lang === "wo"
      ? `\nTotal : ${formatFcfa(total)}\nDafa am 7 jours.\nTegal WA AW si nga bëgg a jël rendez-vous.`
      : `\nTotal : ${formatFcfa(total)}\nValable 7 jours.\nRépondez OUI pour réserver un créneau, ou demandez le patron pour ajuster.`;
  return { text: `${header}${who}\n———\n${body}\n———${footer}`, total };
}
