import { describe, expect, it } from "vitest";
import { polishIsFactSafe } from "@/lib/bot/engine";

describe("bot facts", () => {
  it("accepte une reformulation sans nouveau prix", () => {
    const draft = "Braids longues — 35000 F (3 h).";
    expect(polishIsFactSafe(draft, "Les braids longues sont à 35000 F.")).toBe(true);
  });

  it("accepte une reformulation avec un format d'heure comme 10h00 ou 14h30", () => {
    const draft = "Rendez-vous confirmé le 15 août à 10:00 pour 5000 F.";
    expect(polishIsFactSafe(draft, "C'est confirmé pour le 15 août à 10h00 au tarif de 5000 F.")).toBe(true);
  });

  it("refuse un prix inventé", () => {
    const draft = "Braids longues — 35000 F (3 h).";
    expect(polishIsFactSafe(draft, "Braids longues 99000 F et lissage 12000 F")).toBe(false);
  });
});

