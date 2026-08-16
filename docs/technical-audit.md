# Audit technique — vague 001-saas-foundations

Date : 16 août 2026. Produit : **Assistant Bi**. Périmètre : fondations SaaS (auth, isolation, bot, agenda, billing manuel, admin).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Prisma 6 · SQLite local · Tailwind 4.

## Décisions

| Sujet | Choix | Pourquoi |
|---|---|---|
| Sessions | Cookie HMAC + table `Session` | Révoquer un appareil / impersonation sans JWT opaque |
| PIN | Argon2id, lecture bcrypt | Seed et comptes existants ; rehash au login |
| Lockout | 5 essais, 15 min | Contre brute-force téléphone + PIN court |
| Isolation | `businessId` session, jamais un id client | Un commerce ne lit pas l’autre |
| Agenda | `bookSlot` en transaction | Évite le double RDV |
| Rappels | `updateMany` si `reminderSentAt` null | Un envoi J-1 même si le cron tourne deux fois |
| Abonnement | Dates serveur, essai expiré = bloqué | Le navigateur ne décide pas l’accès |
| Paiement v1 | Wave / OM manuel + `planId` | Pas de PayDunya live tant que NINEA/RCCM manquent |
| WhatsApp Cloud | Webhook + dédup `WebhookEvent`, 503 sans token | Simulateur `/demo` reste le canal de vente |
| Middleware Edge | Format cookie seulement | Prisma n’est pas utilisable sur Edge |

## Risques restants

- SQLite en production : à remplacer par PostgreSQL (Neon) avant le premier client payant. Procédure : `docs/deployment.md`. `GET /api/health` ping la base.
- Middleware ne vérifie pas la révocation : le layout `getSession()` le fait.
- `bookSlot` + `isSlotFree` hors transaction dans le bot : double lecture, la transaction reste la source de vérité.
- Pas de tests E2E Playwright : isolation salon/garage à rejouer à la main (quickstart).
- Tokens Meta / PayDunya absents : volontaire (hors MVP).

## Hors vague

Voix, PDF, SMS, acomptes clients, WhatsApp Cloud réel, wizard onboarding 7 étapes.
