export const SIGNUP_CATEGORIES = ["salon", "garage", "artisan", "infirmier", "autre"] as const;
export type SignupCategory = (typeof SIGNUP_CATEGORIES)[number];

export function isSignupCategory(value: string): value is SignupCategory {
  return (SIGNUP_CATEGORIES as readonly string[]).includes(value);
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
