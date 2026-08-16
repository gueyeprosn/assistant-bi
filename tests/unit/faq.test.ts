import { describe, expect, it } from "vitest";
import { matchFaq, parseFaq } from "@/lib/faq";

describe("faq métier", () => {
  it("retrouve une réponse à partir de mots-clés de la question", () => {
    const items = parseFaq(
      JSON.stringify([
        {
          q: "Est-ce que vous faites la réparation de moto ?",
          r: "Oui, nous réparons toutes motos, venez aux horaires d’ouverture.",
        },
      ]),
    );
    const hit = matchFaq(items, "Vous faites la réparation de moto ?");
    expect(hit?.r).toMatch(/réparons toutes motos/i);
  });

  it("ignore une question trop éloignée", () => {
    const items = parseFaq(
      JSON.stringify([{ q: "Est-ce que vous faites la réparation de moto ?", r: "Oui, toutes motos." }]),
    );
    expect(matchFaq(items, "Vous êtes ouverts dimanche ?")).toBeNull();
  });
});
