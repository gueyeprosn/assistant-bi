# Référence API interne

Contrats : `specs/001-saas-foundations/contracts/`. Catalogue : [error-catalog.md](./error-catalog.md).

## Publiques (démo / ops)

| Méthode | Chemin | Auth |
|---|---|---|
| POST | `/api/demo/chat` | aucune (choix du commerce démo) |
| GET | `/api/demo/thread` | aucune |
| GET | `/api/demo/businesses` | aucune |
| GET | `/api/cron/reminders` | `CRON_SECRET` |
| GET/POST | `/api/webhooks/whatsapp` | verify token / signature Meta |
| GET | `/statut` | publique |

Rate limit webhook : 60 req/min / IP. Login : 5 PIN / 15 min puis verrou **30 min**.
