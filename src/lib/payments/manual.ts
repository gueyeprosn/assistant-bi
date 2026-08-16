export type PaymentChannel = "wave" | "orange_money";

export type CheckoutResult = {
  ok: boolean;
  checkoutUrl?: string;
  error?: string;
};

export interface PaymentProvider {
  name: string;
  createCheckout(opts: {
    amountFcfa: number;
    description: string;
    businessId: string;
    paymentId: string;
  }): Promise<CheckoutResult>;
}

export const manualMobileMoney: PaymentProvider = {
  name: "manual",
  async createCheckout() {
    return {
      ok: true,
      error: undefined,
    };
  },
};

export function merchantNumbers() {
  return {
    wave: process.env.WAVE_MERCHANT_NUMBER || "77 XXX XX XX",
    orange: process.env.ORANGE_MONEY_MERCHANT || "77 XXX XX XX",
  };
}
