/** Normalise un numéro sénégalais vers +221XXXXXXXXX */
export function normalizeSnPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("221") && digits.length === 12) return `+${digits}`;
  if (digits.length === 9) return `+221${digits}`;
  if (digits.length === 10 && digits.startsWith("0")) return `+221${digits.slice(1)}`;
  if (input.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  return `+221${digits}`;
}

export function displayPhone(phone: string): string {
  const d = phone.replace(/[^\d]/g, "");
  if (d.startsWith("221") && d.length === 12) {
    return `+221 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
  }
  return phone;
}

export function isValidSnPhone(input: string): boolean {
  const n = normalizeSnPhone(input);
  return /^\+2217\d{8}$/.test(n);
}
