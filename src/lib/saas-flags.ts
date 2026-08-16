export function saasFlags() {
  return {
    appUrl: (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, ""),
    whatsappToken: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
    whatsappPhone: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
    whatsappVerify: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
    cronSecret: Boolean(process.env.CRON_SECRET),
    supportWhatsApp: Boolean(process.env.SUPPORT_WHATSAPP?.trim()),
    database: Boolean(process.env.DATABASE_URL),
  };
}
