export function formatFcfa(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} F`;
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Dakar",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Dakar",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Dakar",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function todayDakar(): Date {
  const now = new Date();
  const s = now.toLocaleString("en-US", { timeZone: "Africa/Dakar" });
  return new Date(s);
}

export function startOfDayDakar(d: Date): Date {
  const s = d.toLocaleDateString("en-CA", { timeZone: "Africa/Dakar" });
  return new Date(`${s}T00:00:00`);
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function toYmd(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Africa/Dakar" });
}

export function planLabel(plan: string): string {
  switch (plan) {
    case "micro":
      return "Micro";
    case "standard":
      return "Standard";
    case "pro":
      return "Pro";
    default:
      return "Essai";
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case "trial":
      return "Essai";
    case "active":
      return "Actif";
    case "past_due":
      return "Impayé";
    case "suspended":
      return "Suspendu";
    default:
      return status;
  }
}
