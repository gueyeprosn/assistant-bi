import { describe, expect, it } from "vitest";
import { isFourDigitPin, slugFromName } from "@/lib/signup";

describe("signup helpers", () => {
  it("forme un slug lisible avec les 4 derniers chiffres", () => {
    expect(slugFromName("Garage Baobab", "+221771234567")).toBe("garage-baobab-4567");
  });

  it("accepte un PIN de 4 chiffres seulement", () => {
    expect(isFourDigitPin("1234")).toBe(true);
    expect(isFourDigitPin("12")).toBe(false);
    expect(isFourDigitPin("abcd")).toBe(false);
  });
});
