import { describe, expect, it } from "vitest";
import { mrrFcfa, pct, series7Days } from "@/lib/metrics";

describe("control tower KPI helpers", () => {
  it("calcule un pourcentage entier, 0 si dénominateur vide", () => {
    expect(pct(1, 4)).toBe(25);
    expect(pct(0, 0)).toBe(0);
  });

  it("ne compte le MRR que pour un commerce actif", () => {
    expect(mrrFcfa("standard", "active")).toBe(3000);
    expect(mrrFcfa("pro", "active")).toBe(6000);
    expect(mrrFcfa("micro", "trial")).toBe(0);
    expect(mrrFcfa("standard", "past_due")).toBe(0);
  });

  it("agrège 7 jours sans trou", () => {
    const start = new Date("2026-08-10T12:00:00.000Z");
    const series = series7Days(start, [
      new Date("2026-08-10T10:00:00.000Z"),
      new Date("2026-08-10T18:00:00.000Z"),
    ]);
    expect(series).toHaveLength(7);
    expect(series[0].value).toBe(2);
    expect(series.slice(1).every((d) => d.value === 0)).toBe(true);
  });
});
