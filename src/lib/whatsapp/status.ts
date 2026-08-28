export type AssistantConnectionStatus = "connected" | "demo";

/** Vérité serveur : un commerce est "connecté" seulement si des identifiants WhatsApp Cloud API réels existent. */
export function getAssistantConnectionStatus(business: {
  whatsappToken: string;
  whatsappPhoneNumberId: string;
}): AssistantConnectionStatus {
  const envConnected = Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  const businessConnected = Boolean(business.whatsappToken && business.whatsappPhoneNumberId);
  return envConnected || businessConnected ? "connected" : "demo";
}
