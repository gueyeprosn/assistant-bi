import { describe, expect, it } from "vitest";
import { classifyIntent } from "@/lib/bot/intents";
import { detectLanguage } from "@/lib/bot/language";

describe("intent classification & language detection", () => {
  it("détecte correctement les intentions en Wolof", () => {
    expect(classifyIntent("Asalaam aleekum nanga def").intent).toBe("greeting");
    expect(classifyIntent("Damay jël rdv suba").intent).toBe("book");
    expect(classifyIntent("Ñaata la tresses yi ?").intent).toBe("prices");
    expect(classifyIntent("Fann la nekk sa salon ?").intent).toBe("location");
    expect(classifyIntent("Dama bëgg wax ak patron bi").intent).toBe("human");
    expect(classifyIntent("Jërëjëf baax na").intent).toBe("thanks");
  });

  it("détecte la langue Wolof sur des expressions courtes", () => {
    expect(detectLanguage("Nanga def")).toBe("wo");
    expect(detectLanguage("Jerejef")).toBe("wo");
    expect(detectLanguage("Asalaam aleekum")).toBe("wo");
    expect(detectLanguage("Damay ñëw suba")).toBe("wo");
  });

  it("détecte la langue Française", () => {
    expect(detectLanguage("Bonjour, quels sont vos tarifs ?")).toBe("fr");
    expect(detectLanguage("Est-ce que vous êtes disponible demain ?")).toBe("fr");
  });
});
