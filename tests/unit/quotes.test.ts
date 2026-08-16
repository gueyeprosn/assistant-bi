import { describe, expect, it } from "vitest";
import { formatFcfa } from "@/lib/format";
import { buildQuoteText, parseQuoteDraft, parseStoredQuoteLines } from "@/lib/quotes";

describe("devis multi-articles", () => {
  it("accepte un mélange catalogue + prestation libre", () => {
    const parsed = parseQuoteDraft(
      JSON.stringify([
        { serviceId: "svc-1", qty: 2 },
        { name: "Lissage", qty: 1, priceFcfa: 25000, saveService: true },
      ]),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.lines).toHaveLength(2);
    expect(parsed.lines[0]?.serviceId).toBe("svc-1");
    expect(parsed.lines[0]?.qty).toBe(2);
    expect(parsed.lines[1]?.name).toBe("Lissage");
    expect(parsed.lines[1]?.saveService).toBe(true);
  });

  it("refuse un devis vide", () => {
    expect(parseQuoteDraft("[]").ok).toBe(false);
    expect(parseQuoteDraft("nope").ok).toBe(false);
  });

  it("compose un texte WhatsApp avec plusieurs lignes", () => {
    const { text, total } = buildQuoteText({
      businessName: "Salon Awa",
      customerName: "Fatou",
      lines: [
        { name: "Tresses", qty: 2, priceFcfa: 15000 },
        { name: "Brushing", qty: 1, priceFcfa: 5000 },
      ],
      lang: "fr",
      note: "Acompte 10 000 F",
    });
    expect(total).toBe(35000);
    expect(text).toContain("Tresses × 2");
    expect(text).toContain("Brushing");
    expect(text).toContain(formatFcfa(35000));
    expect(text).toContain("Acompte 10 000 F");
    expect(text).not.toMatch(/pdf/i);
  });

  it("relit les lignes enregistrées", () => {
    const lines = parseStoredQuoteLines(
      JSON.stringify([{ name: "Vidange", qty: 1, priceFcfa: 12000 }]),
    );
    expect(lines).toEqual([{ name: "Vidange", qty: 1, priceFcfa: 12000 }]);
  });
});
