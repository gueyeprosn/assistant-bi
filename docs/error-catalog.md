# Catalogue d’erreurs API

Format unique :

```json
{ "success": false, "error": { "code": "STRING", "message": "humain FR ou WO" } }
```

Le **client WhatsApp** ne reçoit jamais le code technique — seulement une phrase simple, ou un transfert au patron.

| Code | HTTP | Message FR | Message WO |
|---|---|---|---|
| AUTH_INVALID_CREDENTIALS | 401 | Numéro ou code PIN incorrect. | Nummer walla PIN bi baaxul. |
| AUTH_ACCOUNT_LOCKED | 423 | Trop d’essais. Réessayez plus tard. | Jéem yu bari. Fàww nga xaar. |
| AUTH_SESSION_EXPIRED | 401 | Session expirée. Reconnectez-vous. | Session bi jeex na. Duggalwaat. |
| AUTH_PERMISSION_DENIED | 403 | Accès refusé. | Mënuloo dugg. |
| BUSINESS_NOT_FOUND | 404 | Commerce introuvable. | Commerce bi amul. |
| BUSINESS_SUSPENDED | 403 | Commerce suspendu. | Commerce bi dafa tëj. |
| APPOINTMENT_SLOT_UNAVAILABLE | 409 | Ce créneau n’est plus libre. | Créneau bii dafa am. |
| APPOINTMENT_NOT_FOUND | 404 | Rendez-vous introuvable. | Rendez-vous bi amul. |
| APPOINTMENT_ALREADY_CANCELLED | 409 | Ce rendez-vous est déjà annulé. | Rendez-vous bi dindi nañu ko. |
| APPOINTMENT_OUTSIDE_HOURS | 400 | Hors des horaires d’ouverture. | Waxtu ubbiin bi jeex. |
| APPOINTMENT_TOO_SOON | 400 | Préavis insuffisant. | Waxtu bu njëkk dafa néew. |
| QUOTE_EXPIRED | 410 | Ce devis n’est plus valable. | Devis bi jeex na. |
| QUOTE_NOT_FOUND | 404 | Devis introuvable. | Devis bi amul. |
| SUBSCRIPTION_TRIAL_EXPIRED | 402 | L’essai est terminé. | Essai bi jeex na. |
| SUBSCRIPTION_PAST_DUE | 402 | Paiement en attente. | Paiement dafa xaar. |
| SUBSCRIPTION_SUSPENDED | 403 | Compte suspendu. | Compte bi dafa tëj. |
| PAYMENT_ALREADY_CONFIRMED | 409 | Paiement déjà confirmé. | Paiement bi confimé nañu ko. |
| PAYMENT_INVALID_REFERENCE | 400 | Référence de paiement invalide. | Référence bi baaxul. |
| WEBHOOK_INVALID_SIGNATURE | 401 | Signature invalide. | Signature baaxul. |
| WEBHOOK_DUPLICATE_EVENT | 200 | Événement déjà traité. | Lii def nañu ko. |
| WHATSAPP_NOT_CONFIGURED | 503 | WhatsApp non configuré. | WhatsApp jekkagul. |
| RATE_LIMITED | 429 | Trop de requêtes. Patientez. | Baat yu bari. Xaaral. |
| VALIDATION_ERROR | 400 | Requête invalide. | Lii baaxul. |
| INTERNAL_ERROR | 500 | Problème technique. Réessayez. | Jafe-jafe teknik. Jéemaat. |
| CRON_UNAUTHORIZED | 401 | Non autorisé. | Mënuloo. |

Source code : `src/lib/errors.ts`.
