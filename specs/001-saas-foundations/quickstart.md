# Quickstart — valider 001-saas-foundations

Preuve terrain que la vague « commercialisable » tient. Détails modèle : [data-model.md](./data-model.md). Contrats : [contracts/http.md](./contracts/http.md), [contracts/server-actions.md](./contracts/server-actions.md).

## Prérequis

- Node 20+
- `.env` depuis `.env.example` (`SESSION_SECRET` **non vide**)
- Pas besoin de `OPENAI_API_KEY` ni de tokens WhatsApp

## Setup

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Ouvrir http://localhost:3000

## Comptes

| Rôle | Téléphone | PIN |
|---|---|---|
| Salon | 77 111 11 11 | 1234 |
| Garage | 77 222 22 22 | 1234 |
| Admin | 77 000 00 00 | 0000 |

## Scénarios de validation (ordre)

### 1. Isolation (SC-003)

1. Login salon → noter un id de RDV ou conversation dans l’URL s’il y en a.
2. Logout, login garage.
3. Coller l’URL salon : **aucune** donnée Awa. Message d’erreur ou accueil garage.

### 2. Démo 5 minutes (SC-001)

1. `/demo` → Salon Awa.
2. Envoyer un tarif (« braids »), puis un RDV.
3. Login salon → `/app` / agenda : le RDV est là.

### 3. Handoff

1. `/demo` : message volontairement hors fiche (« vous livrez à Thiès ? »).
2. Réponse de transfert, pas un prix inventé.
3. `/app/messages` : file à reprendre. Répondre, puis rendre la main.

### 4. Double créneau (SC-005)

1. Réserver un horaire via démo.
2. Même horaire, autre téléphone (ou 2e fil) : refus + 2–3 alternatives.

### 5. Rappel idempotent (SC-006)

```bash
curl "http://localhost:3000/api/cron/reminders?secret=CRON_SECRET"
curl "http://localhost:3000/api/cron/reminders?secret=CRON_SECRET"
```

Un RDV éligible (demain, `reminderSentAt` null) : `sent` > 0 la 1re fois, `sent` = 0 la 2e (même RDV).

### 6. Essai serveur (SC-007)

En admin ou seed temporaire : `trialEndsAt` dans le passé. Login patron : écran abonnement / accès métier coupé, pas l’agenda complet.

### 7. Paiement + audit (SC-009)

1. Patron : demander paiement Standard.
2. Admin : confirmer **avec** le plan Standard.
3. Commerce `active` + plan standard. Journal admin : confirmation visible.
4. Impersonation : motif obligatoire, bandeau, retour admin, trace.

### 8. Lockout PIN

5 PIN faux salon → message de verrouillage. Attendre / seed reset. Audit `login_fail` / `lockout`.

### 9. Mobile 375 px (SC-002)

`/`, `/demo`, `/login`, `/app` : pas de scroll horizontal, boutons ≥ 48 px, FR|WO.

### 10. Tests automatisés

```bash
npm test
```

Attendus : isolation, overlap booking, reminder idempotent, subscription expirée.

## Hors validation cette vague

WhatsApp Cloud réel, PayDunya live, wizard d’onboarding 7 étapes, Argon2 sans comptes bcrypt (les seed peuvent encore être bcrypt jusqu’au premier login).
