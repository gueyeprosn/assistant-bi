import { describe, expect, it } from "vitest";
import { isFourDigitPin, parseSignupForm, parseSignupServices, slugFromName } from "@/lib/signup";

describe("signup helpers", () => {
  it("forme un slug lisible avec les 4 derniers chiffres", () => {
    expect(slugFromName("Garage Baobab", "+221771234567")).toBe("garage-baobab-4567");
  });

  it("accepte un PIN de 4 chiffres seulement", () => {
    expect(isFourDigitPin("1234")).toBe(true);
    expect(isFourDigitPin("12")).toBe(false);
    expect(isFourDigitPin("abcd")).toBe(false);
  });

  it("ignore les prestations sans nom", () => {
    expect(
      parseSignupServices(["Braids simple", ""], ["8000", "1000"], ["180", "30"]),
    ).toEqual([{ name: "Braids simple", priceFcfa: 8000, durationMin: 180 }]);
  });

  it("refuse une fiche sans prestation", () => {
    const form = new FormData();
    form.set("businessName", "Salon Awa");
    form.set("category", "salon");
    form.set("address", "Rue 6, Médina");
    form.set("phone", "77 111 11 11");
    form.set("pin", "1234");
    form.set("pinConfirm", "1234");
    form.set("defaultLang", "fr");
    form.set("holidayPolicy", "closed");
    const parsed = parseSignupForm(form);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/prestation/i);
  });

  it("accepte une fiche complète", () => {
    const form = new FormData();
    form.set("businessName", "Salon Awa");
    form.set("category", "salon");
    form.set("address", "Rue 6, Médina");
    form.set("neighborhood", "Médina");
    form.set("phone", "77 111 11 11");
    form.set("pin", "1234");
    form.set("pinConfirm", "1234");
    form.set("defaultLang", "both");
    form.set("holidayPolicy", "closed");
    form.append("serviceName", "Braids simple");
    form.append("servicePriceFcfa", "8000");
    form.append("serviceDurationMin", "180");
    form.append("faqQ", "Est-ce que vous faites la réparation de moto ?");
    form.append("faqR", "Non, nous sommes un salon de coiffure.");
    form.set("minimumNoticeHours", "2");
    form.set("slotStepMin", "30");
    form.set("maxAppointmentsPerDay", "8");
    form.set("reminderEnabled", "yes");
    form.set("reminderHour", "10");
    const parsed = parseSignupForm(form);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.minimumNoticeMin).toBe(120);
    expect(parsed.data.services).toHaveLength(1);
    expect(parsed.data.faqs).toHaveLength(1);
    expect(parsed.data.defaultLang).toBe("both");
    expect(parsed.data.reminderHour).toBe(10);
  });

  it("accepte un métier saisi librement", () => {
    const form = new FormData();
    form.set("businessName", "Remchou Shop");
    form.set("category", "Vente en ligne");
    form.set("address", "Livraison à domicile");
    form.set("phone", "77 666 66 66");
    form.set("pin", "1234");
    form.set("pinConfirm", "1234");
    form.set("defaultLang", "fr");
    form.set("holidayPolicy", "closed");
    form.append("serviceName", "Set de draps");
    form.append("servicePriceFcfa", "12500");
    form.append("serviceDurationMin", "15");
    const parsed = parseSignupForm(form);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.category).toBe("Vente en ligne");
  });
});
