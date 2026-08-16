export const ERRORS = {
  AUTH_INVALID_CREDENTIALS: { status: 401, fr: "Numéro ou code PIN incorrect.", wo: "Nummer walla PIN bi baaxul." },
  AUTH_ACCOUNT_LOCKED: { status: 423, fr: "Trop d’essais. Réessayez plus tard.", wo: "Jéem yu bari. Fàww nga xaar." },
  AUTH_SESSION_EXPIRED: { status: 401, fr: "Session expirée. Reconnectez-vous.", wo: "Session bi jeex na. Duggalwaat." },
  AUTH_PERMISSION_DENIED: { status: 403, fr: "Accès refusé.", wo: "Mënuloo dugg." },
  BUSINESS_NOT_FOUND: { status: 404, fr: "Commerce introuvable.", wo: "Commerce bi amul." },
  BUSINESS_SUSPENDED: { status: 403, fr: "Commerce suspendu.", wo: "Commerce bi dafa tëj." },
  APPOINTMENT_SLOT_UNAVAILABLE: { status: 409, fr: "Ce créneau n’est plus libre.", wo: "Créneau bii dafa am." },
  APPOINTMENT_NOT_FOUND: { status: 404, fr: "Rendez-vous introuvable.", wo: "Rendez-vous bi amul." },
  APPOINTMENT_ALREADY_CANCELLED: { status: 409, fr: "Ce rendez-vous est déjà annulé.", wo: "Rendez-vous bi dindi nañu ko." },
  APPOINTMENT_OUTSIDE_HOURS: { status: 400, fr: "Hors des horaires d’ouverture.", wo: "Waxtu ubbiin bi jeex." },
  APPOINTMENT_TOO_SOON: { status: 400, fr: "Préavis insuffisant.", wo: "Waxtu bu njëkk dafa néew." },
  QUOTE_EXPIRED: { status: 410, fr: "Ce devis n’est plus valable.", wo: "Devis bi jeex na." },
  QUOTE_NOT_FOUND: { status: 404, fr: "Devis introuvable.", wo: "Devis bi amul." },
  SUBSCRIPTION_TRIAL_EXPIRED: { status: 402, fr: "L’essai est terminé.", wo: "Essai bi jeex na." },
  SUBSCRIPTION_PAST_DUE: { status: 402, fr: "Paiement en attente.", wo: "Paiement dafa xaar." },
  SUBSCRIPTION_SUSPENDED: { status: 403, fr: "Compte suspendu.", wo: "Compte bi dafa tëj." },
  PAYMENT_ALREADY_CONFIRMED: { status: 409, fr: "Paiement déjà confirmé.", wo: "Paiement bi confimé nañu ko." },
  PAYMENT_INVALID_REFERENCE: { status: 400, fr: "Référence de paiement invalide.", wo: "Référence bi baaxul." },
  WEBHOOK_INVALID_SIGNATURE: { status: 401, fr: "Signature invalide.", wo: "Signature baaxul." },
  WEBHOOK_DUPLICATE_EVENT: { status: 200, fr: "Événement déjà traité.", wo: "Lii def nañu ko." },
  WHATSAPP_NOT_CONFIGURED: { status: 503, fr: "WhatsApp non configuré.", wo: "WhatsApp jekkagul." },
  RATE_LIMITED: { status: 429, fr: "Trop de requêtes. Patientez.", wo: "Baat yu bari. Xaaral." },
  VALIDATION_ERROR: { status: 400, fr: "Requête invalide.", wo: "Lii baaxul." },
  INTERNAL_ERROR: { status: 500, fr: "Problème technique. Réessayez.", wo: "Jafe-jafe teknik. Jéemaat." },
  CRON_UNAUTHORIZED: { status: 401, fr: "Non autorisé.", wo: "Mënuloo." },
} as const;

export type ErrorCode = keyof typeof ERRORS;

export function errorMessage(code: ErrorCode, lang: "fr" | "wo" = "fr") {
  return ERRORS[code][lang];
}

export const BOT_TECHNICAL_FR =
  "Je rencontre un problème technique, réessayez dans un instant.";
export const BOT_TECHNICAL_WO = "Jafe-jafe teknik am na. Jéemaat ci kanam.";
