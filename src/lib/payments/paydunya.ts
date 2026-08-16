import type { CheckoutResult, PaymentProvider } from "./manual";

/** Stub PayDunya — activer après KYC (NINEA / RCCM). */
export const paydunyaProvider: PaymentProvider = {
  name: "paydunya",
  async createCheckout(opts): Promise<CheckoutResult> {
    const master = process.env.PAYDUNYA_MASTER_KEY;
    const priv = process.env.PAYDUNYA_PRIVATE_KEY;
    const token = process.env.PAYDUNYA_TOKEN;
    if (!master || !priv || !token) {
      return {
        ok: false,
        error: "PayDunya n'est pas configuré. Utilisez le paiement Wave / Orange Money manuel.",
      };
    }
    const mode = process.env.PAYDUNYA_MODE === "live" ? "live" : "test";
    const base =
      mode === "live"
        ? "https://app.paydunya.com/api/v1"
        : "https://app.paydunya.com/sandbox-api/v1";
    try {
      const res = await fetch(`${base}/checkout-invoice/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PAYDUNYA-MASTER-KEY": master,
          "PAYDUNYA-PRIVATE-KEY": priv,
          "PAYDUNYA-TOKEN": token,
        },
        body: JSON.stringify({
          invoice: {
            total_amount: opts.amountFcfa,
            description: opts.description,
          },
          store: { name: "Assistant Bi" },
          custom_data: {
            businessId: opts.businessId,
            paymentId: opts.paymentId,
          },
        }),
      });
      const data = (await res.json()) as {
        response_code?: string;
        response_text?: string;
        invoice_url?: string;
      };
      if (data.response_code === "00" && data.invoice_url) {
        return { ok: true, checkoutUrl: data.invoice_url };
      }
      return { ok: false, error: data.response_text || "Erreur PayDunya" };
    } catch {
      return { ok: false, error: "Impossible de joindre PayDunya." };
    }
  },
};
