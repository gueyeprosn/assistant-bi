import { describe, expect, it } from "vitest";
import { polishIsFactSafe } from "@/lib/bot/engine";

describe("bot facts", () => {
  it("accepte une reformulation sans nouveau prix", () => {
    const draft = "Braids longues — 35000 F (3 h).";
    expect(polishIsFactSafe(draft, "Les braids longues sont à 35000 F.")).toBe(true);
  });

  it("refuse un prix inventé", () => {
    const draft = "Braids longues — 35000 F (3 h).";
    expect(polishIsFactSafe(draft, "Braids longues 99000 F et lissage 12000 F")).toBe(false);
  });
});
