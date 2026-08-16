# Assistant Bi

Secrétaire virtuelle IA **WhatsApp** pour petits professionnels sénégalais (Dakar d’abord). Français + wolof. Pas d’application à installer : WhatsApp côté client, navigateur mobile côté patron.

Le nom commercial est **Assistant Bi** uniquement. Ne pas écrire « SecrétAIRE Local » sur un livrable.

## Ce que fait le MVP

- Landing marketing (glassmorphism, logos `public/brand/`)
- Simulateur WhatsApp `/demo` pour vendre sur le terrain **sans API Meta**
- Moteur conversationnel FR/wolof : horaires, rendez-vous, devis texte, transfert au patron
- Rappels J-1 + libération du créneau si annulation
- Dashboard mobile `/app` : accueil, agenda, messages, fiche bot, devis, relances, stats, abonnement
- Auth téléphone sénégalais + PIN (pas d’e-mail)
- Essai 7 jours, formules Micro / Standard / Pro (1 500 / 3 000 / 6 000 F)
- Paiement Wave / Orange Money **manuel**, confirmation dans `/admin`
- Back-office : paiements, suspension, impersonation, +7 jours d’essai
- i18n FR | WO (cookie `ab_lang`)

Hors MVP : voix sortante, acomptes clients, PDF, SMS, multi-sites, compta, WhatsApp Cloud réel (tant que les tokens Meta/BSP ne sont pas dans `.env`).

## Démarrage local

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Sans `OPENAI_API_KEY`, le bot reste sur des règles FR/wolof + la fiche métier. Avec la clé, les réponses peuvent être reformulées.

Réinitialiser la base démo : `npm run db:reset`.

### Tests

```bash
npm test
```

Vitest (Node) : isolation tenant, lockout PIN, faits bot, overlap agenda, rappel J-1 idempotent, essai expiré. La base de test est `prisma/test.db` (ignorée par git).

### Comptes démo

| Rôle | Téléphone | PIN |
|---|---|---|
| Salon Awa Braids (Médina) | 77 111 11 11 | 1234 |
| Garage Touba Auto (Pikine) | 77 222 22 22 | 1234 |
| Admin | 77 000 00 00 | 0000 |

| Page | URL |
|---|---|
| Accueil | [/](http://localhost:3000/) |
| Simulateur client | [/demo](http://localhost:3000/demo) |
| Connexion | [/login](http://localhost:3000/login) |
| Dashboard patron | [/app](http://localhost:3000/app) |
| Back-office | [/admin](http://localhost:3000/admin) |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 6 · SQLite (local) · Tailwind 4

En production visée : PostgreSQL (Neon) + Vercel, puis WhatsApp Cloud API — voir [docs/whatsapp-coexistence.md](docs/whatsapp-coexistence.md).

### Variables d’environnement

Voir `.env.example`. Les plus utiles en local :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | SQLite `file:./dev.db` |
| `SESSION_SECRET` | Cookie de session |
| `OPENAI_API_KEY` | Optionnel — reformulation |
| `CRON_SECRET` | Protège `/api/cron/reminders` |
| `WHATSAPP_*` | Cloud API (vide = simulateur seulement) |
| `WAVE_MERCHANT_NUMBER` / `ORANGE_MONEY_MERCHANT` | Affichés au paiement |

## Marque et UI

- Navy `#0B1F3A` · or `#C9A84C` · blanc
- Landing : verre dépoli (page `/` uniquement). Le dashboard reste fond blanc, boutons ≥ 48 px
- Logos : `public/brand/icon.png`, `logo.png`, `logo-reverse.png`, `logo-mono.png`
- Charte : [design-system/assistant-bi/MASTER.md](design-system/assistant-bi/MASTER.md)
- Overrides landing : [design-system/assistant-bi/pages/landing.md](design-system/assistant-bi/pages/landing.md)

## Paiements

v1 : Wave / Orange Money **manuel** (le commercial confirme dans `/admin`).  
PayDunya est stubbé (`src/lib/payments/paydunya.ts`) pour après NINEA/RCCM.

## WhatsApp et cron

Le webhook Meta est prêt mais inactif sans tokens : `POST /api/webhooks/whatsapp`.

Rappels J-1 : `GET /api/cron/reminders?secret=CRON_SECRET` — cron Vercel `0 18 * * *` (18:00 UTC) dans `vercel.json`.

## Spec-Driven Development ([Spec Kit](https://github.com/github/spec-kit))

Le cahier `project.md` est la source produit. Spec Kit le découpe en artefacts exécutables :

| Artefact | Fichier |
|---|---|
| Principes | [`.specify/memory/constitution.md`](.specify/memory/constitution.md) |
| Spec vague 1 | [`specs/001-saas-foundations/spec.md`](specs/001-saas-foundations/spec.md) |

Plan et tâches de la vague 1 : [`plan.md`](specs/001-saas-foundations/plan.md), [`tasks.md`](specs/001-saas-foundations/tasks.md).  
Dans Cursor : `/speckit-implement` (US1 d’abord). CLI : `specify` (`specify-cli`, `cursor-agent`).

## Documents vente

- [Argumentaire](docs/argumentaire-vente.md)
- [Fiche onboarding](docs/fiche-onboarding.md)
- [Essai 7 jours](docs/processus-essai.md)
- [Plan financier](docs/plan-financier.md)
- [Cibles Dakar](docs/cibles-dakar.md)
- [Prompts design](docs/prompts-design.md)
