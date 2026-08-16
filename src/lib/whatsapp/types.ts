export type InboundMessage = {
  provider: "simulator" | "cloud";
  businessId: string;
  fromPhone: string;
  fromName?: string;
  text: string;
  providerMessageId?: string;
};

export interface WhatsAppAdapter {
  name: "simulator" | "cloud";
  sendText(toPhone: string, text: string, businessId: string): Promise<void>;
}

export function splitWhatsAppChunks(text: string, max = 1500): string[] {
  if (text.length <= max) return [text];
  const parts: string[] = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf("\n", max);
    if (cut < 40) cut = max;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}
