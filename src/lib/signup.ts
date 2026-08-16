import { parseFaqFields, type FaqItem } from "./faq";
import { DEFAULT_WEEK_HOURS, parseHours, type HoursMap } from "./hours";
import { isValidSnPhone } from "./phone";

export const SIGNUP_CATEGORIES = ["salon", "garage", "artisan", "infirmier", "autre"] as const;
export type SignupCategory = (typeof SIGNUP_CATEGORIES)[number];

export const DEFAULT_LANGS = ["fr", "wo", "both"] as const;
export type DefaultLang = (typeof DEFAULT_LANGS)[number];

export const HOLIDAY_POLICIES = ["closed", "special"] as const;
export type HolidayPolicy = (typeof HOLIDAY_POLICIES)[number];

export type SignupService = { name: string; priceFcfa: number; durationMin: number };

export type SignupFiche = {
  phoneRaw: string;
  pin: string;
  pinConfirm: string;
  businessName: string;
  ownerName: string;
  category: SignupCategory;
  neighborhood: string;
  address: string;
  secondaryPhoneRaw: string;
  defaultLang: DefaultLang;
  hoursJson: string;
  holidayPolicy: HolidayPolicy;
  holidayHoursNote: string;
  services: SignupService[];
  faqs: FaqItem[];
  slotStepMin: number;
  minimumNoticeMin: number;
  maxAppointmentsPerDay: number;
  confirmationMessage: string;
  reminderEnabled: boolean;
  reminderHour: number;
};

export function isSignupCategory(value: string): value is SignupCategory {
  return (SIGNUP_CATEGORIES as readonly string[]).includes(value);
}

export function isDefaultLang(value: string): value is DefaultLang {
  return (DEFAULT_LANGS as readonly string[]).includes(value);
}

export function isHolidayPolicy(value: string): value is HolidayPolicy {
  return (HOLIDAY_POLICIES as readonly string[]).includes(value);
}

export function slugFromName(name: string, phone: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const tail = phone.replace(/\D/g, "").slice(-4);
  return `${base || "commerce"}-${tail || "0000"}`;
}

export function isFourDigitPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function parseSignupServices(names: string[], prices: string[], durations: string[]): SignupService[] {
  const out: SignupService[] = [];
  const n = Math.max(names.length, prices.length, durations.length);
  for (let i = 0; i < n; i++) {
    const name = String(names[i] || "").trim();
    const priceFcfa = parseInt(String(prices[i] || "0"), 10);
    const durationMin = parseInt(String(durations[i] || "60"), 10);
    if (!name) continue;
    if (!Number.isFinite(priceFcfa) || priceFcfa < 0) continue;
    out.push({
      name,
      priceFcfa,
      durationMin: Number.isFinite(durationMin) && durationMin > 0 ? durationMin : 60,
    });
  }
  return out;
}

function intOr(value: string, fallback: number, min: number, max: number) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function hoursJsonOrDefault(raw: string): string {
  const parsed: HoursMap = parseHours(raw);
  const hasAny = Object.values(parsed).some((slots) => slots.length > 0);
  return JSON.stringify(hasAny ? parsed : DEFAULT_WEEK_HOURS);
}

export function parseSignupForm(form: FormData): { ok: true; data: SignupFiche } | { ok: false; error: string } {
  const businessName = String(form.get("businessName") || "").trim();
  const ownerName = String(form.get("ownerName") || "").trim() || businessName;
  const categoryRaw = String(form.get("category") || "");
  const address = String(form.get("address") || "").trim();
  const neighborhood = String(form.get("neighborhood") || "").trim() || address;
  const phoneRaw = String(form.get("phone") || "").trim();
  const secondaryPhoneRaw = String(form.get("secondaryPhone") || "").trim();
  const pin = String(form.get("pin") || "").trim();
  const pinConfirm = String(form.get("pinConfirm") || "").trim();
  const defaultLangRaw = String(form.get("defaultLang") || "fr");
  const holidayPolicyRaw = String(form.get("holidayPolicy") || "closed");
  const holidayHoursNote = String(form.get("holidayHoursNote") || "").trim();
  const confirmationMessage = String(form.get("confirmationMessage") || "").trim();
  const reminderEnabled = String(form.get("reminderEnabled") || "yes") !== "no";
  const noticeHours = intOr(String(form.get("minimumNoticeHours") || "1"), 1, 0, 72);
  const services = parseSignupServices(
    form.getAll("serviceName").map(String),
    form.getAll("servicePriceFcfa").map(String),
    form.getAll("serviceDurationMin").map(String),
  );
  const faqs = parseFaqFields(form.getAll("faqQ").map(String), form.getAll("faqR").map(String));

  if (!businessName || businessName.length < 2) {
    return { ok: false, error: "Indiquez le nom de l’établissement." };
  }
  if (!isSignupCategory(categoryRaw)) {
    return { ok: false, error: "Choisissez votre métier." };
  }
  if (!address) {
    return { ok: false, error: "Indiquez l’adresse complète." };
  }
  if (!isValidSnPhone(phoneRaw)) {
    return { ok: false, error: "Numéro WhatsApp sénégalais invalide. Exemple : 77 111 11 11." };
  }
  if (secondaryPhoneRaw && !isValidSnPhone(secondaryPhoneRaw)) {
    return { ok: false, error: "Le numéro secondaire n’est pas un numéro sénégalais valide." };
  }
  if (!isFourDigitPin(pin)) {
    return { ok: false, error: "Le code PIN doit avoir 4 chiffres." };
  }
  if (pin !== pinConfirm) {
    return { ok: false, error: "Les deux codes PIN ne sont pas identiques." };
  }
  if (!isDefaultLang(defaultLangRaw)) {
    return { ok: false, error: "Choisissez la langue des réponses." };
  }
  if (!isHolidayPolicy(holidayPolicyRaw)) {
    return { ok: false, error: "Indiquez la règle des jours fériés." };
  }
  if (!services.length) {
    return { ok: false, error: "Ajoutez au moins une prestation avec un prix." };
  }

  return {
    ok: true,
    data: {
      phoneRaw,
      pin,
      pinConfirm,
      businessName,
      ownerName,
      category: categoryRaw,
      neighborhood,
      address,
      secondaryPhoneRaw,
      defaultLang: defaultLangRaw,
      hoursJson: hoursJsonOrDefault(String(form.get("hoursJson") || "")),
      holidayPolicy: holidayPolicyRaw,
      holidayHoursNote,
      services,
      faqs,
      slotStepMin: intOr(String(form.get("slotStepMin") || "30"), 30, 15, 240),
      minimumNoticeMin: noticeHours * 60,
      maxAppointmentsPerDay: intOr(String(form.get("maxAppointmentsPerDay") || "0"), 0, 0, 200),
      confirmationMessage,
      reminderEnabled,
      reminderHour: intOr(String(form.get("reminderHour") || "9"), 9, 0, 23),
    },
  };
}
