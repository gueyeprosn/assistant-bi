export type PlanId = "trial" | "micro" | "standard" | "pro";

export const PLANS: Record<
  Exclude<PlanId, "trial">,
  {
    id: Exclude<PlanId, "trial">;
    name: string;
    priceFcfa: number;
    rdvPerMonth: number | null;
    quotes: boolean;
    stats: boolean;
    target: string;
  }
> = {
  micro: {
    id: "micro",
    name: "Micro",
    priceFcfa: 1500,
    rdvPerMonth: 25,
    quotes: false,
    stats: false,
    target: "Artisan seul, petit salon",
  },
  standard: {
    id: "standard",
    name: "Standard",
    priceFcfa: 3000,
    rdvPerMonth: 80,
    quotes: true,
    stats: false,
    target: "Salon, garage, cabinet libéral",
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceFcfa: 6000,
    rdvPerMonth: null,
    quotes: true,
    stats: true,
    target: "Centre de formation, petite clinique",
  },
};

export function effectivePlan(plan: string, status: string): PlanId {
  if (status === "trial" || plan === "trial") return "trial";
  if (plan === "micro" || plan === "standard" || plan === "pro") return plan;
  return "trial";
}

export function canUseQuotes(plan: string, status: string): boolean {
  const p = effectivePlan(plan, status);
  return p === "trial" || p === "standard" || p === "pro";
}

export function canUseStats(plan: string, status: string): boolean {
  const p = effectivePlan(plan, status);
  return p === "trial" || p === "pro";
}

export function rdvLimit(plan: string, status: string): number | null {
  const p = effectivePlan(plan, status);
  if (p === "trial" || p === "pro") return null;
  return PLANS[p].rdvPerMonth;
}

export function planPrice(plan: string): number {
  if (plan === "micro" || plan === "standard" || plan === "pro") {
    return PLANS[plan].priceFcfa;
  }
  return PLANS.standard.priceFcfa;
}

export type AccessStatus = "trial" | "active" | "past_due" | "suspended" | "expired" | "cancelled";

export function getSubscriptionStatus(b: {
  status: string;
  plan: string;
  trialEndsAt: Date | null;
}): { status: AccessStatus; blocked: boolean } {
  if (b.status === "suspended") return { status: "suspended", blocked: true };
  if (b.status === "cancelled") return { status: "cancelled", blocked: true };
  if (b.status === "trial" || b.plan === "trial") {
    if (b.trialEndsAt && b.trialEndsAt.getTime() < Date.now()) {
      return { status: "expired", blocked: true };
    }
    return { status: "trial", blocked: false };
  }
  if (b.status === "past_due") return { status: "past_due", blocked: true };
  if (b.status === "active") return { status: "active", blocked: false };
  return { status: "expired", blocked: true };
}
