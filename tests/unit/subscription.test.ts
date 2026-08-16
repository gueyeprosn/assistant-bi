import { describe, expect, it } from "vitest";
import { getSubscriptionStatus } from "@/lib/plans";

describe("subscription", () => {
  it("coupe un essai dont la date serveur est passée", () => {
    const r = getSubscriptionStatus({
      status: "trial",
      plan: "trial",
      trialEndsAt: new Date(Date.now() - 1000),
    });
    expect(r.status).toBe("expired");
    expect(r.blocked).toBe(true);
  });

  it("laisse un essai en cours", () => {
    const r = getSubscriptionStatus({
      status: "trial",
      plan: "trial",
      trialEndsAt: new Date(Date.now() + 86400000),
    });
    expect(r.blocked).toBe(false);
  });
});
