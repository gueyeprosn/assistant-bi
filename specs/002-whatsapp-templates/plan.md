# Implementation Plan: Modèles WhatsApp hors fenêtre 24h

**Branch**: `002-whatsapp-templates` | **Date**: 2026-08-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-whatsapp-templates/spec.md`

## Summary

Compléter l'adaptateur WhatsApp Cloud API existant (`src/lib/whatsapp/cloud.ts`) pour qu'il envoie un **modèle Meta approuvé** au lieu de texte libre dès que le destinataire (client ou patron) n'a pas écrit au commerce dans les 24 heures précédentes — cas des rappels J-1 et des notifications patron. Approche : **étendre** l'adaptateur et `Business` (nouveau champ JSON de mapping usage → modèle), pas de nouvelle table ni de réécriture du moteur conversationnel.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Next.js 16 App Router

**Primary Dependencies**: Prisma 6 (champ `Business` existant), aucune nouvelle dépendance — appel `fetch` direct vers Graph API comme l'existant

**Storage**: SQLite local / PostgreSQL prod (schéma déjà compatible) — un champ `String` JSON de plus sur `Business`, même pattern que `hoursJson`

**Testing**: Vitest — tests unitaires sur le calcul de fenêtre (dernier message entrant) et sur le choix template vs texte libre ; pas d'appel réseau réel dans les tests (Meta non mockable en CI sans credentials)

**Target Platform**: Node sur Vercel (cron `reminders`, actions serveur, webhook) — aucun changement client/mobile

**Project Type**: Application web monolithique existante

**Performance Goals**: Aucun changement (le calcul de fenêtre est une requête indexée `Message` déjà couverte par l'index `[conversationId, createdAt]`)

**Constraints**: Ne jamais envoyer de texte libre hors fenêtre (rejeté par Meta) ; ne jamais inventer une valeur de variable de modèle (Constitution III) ; rester un no-op complet sans `WHATSAPP_ACCESS_TOKEN`

**Scale/Scope**: 4 usages de modèles (rappel J-1, nouveau RDV, transfert, annulation) ; 2 écrans existants à étendre (`/app/parametres`, `/admin/commerces/[id]`) ; aucun nouvel écran

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Gate | Statut |
|---|---|---|
| I. Produit avant techno | Pas de jargon technique visible ; vocabulaire "modèle de message" côté UI | PASS — champ texte simple, pas de nouvel écran |
| II. Isolation | Mapping de modèles scoping par `businessId` | PASS — stocké sur `Business`, mêmes policies que le reste des réglages |
| III. Vérité métier | Variables de modèle = données réelles de l'événement, jamais inventées | PASS — mêmes sources que les textes libres actuels (rendez-vous, service, business) |
| IV. Vérité serveur | Décision session-vs-template calculée côté serveur à l'envoi, jamais côté client | PASS — requête `Message` au moment de l'envoi |
| V. Améliorer l'existant | Étendre `cloudAdapter`, pas de nouvel adaptateur ; champ JSON sur `Business`, pas de nouvelle table | PASS |

Hors périmètre (Embedded Signup, coexistence, nouveaux usages de notification, validation de structure de modèle côté Meta) : **non implémenté**, conforme à la spec.

## Project Structure

### Documentation (this feature)

```text
specs/002-whatsapp-templates/
├── plan.md              # Ce fichier
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── whatsapp-templates.md
└── tasks.md              # /speckit-tasks — pas ce livrable
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── whatsapp/
│       ├── cloud.ts          # + sendTemplate(), + resolveSendMode()
│       └── types.ts          # + type WhatsAppAdapter.sendTemplate (optionnel)
├── lib/
│   └── reminders.ts           # sendJ1Reminders() : vérifie la fenêtre avant d'envoyer
├── lib/
│   └── whatsapp/notify-owner.ts  # idem pour les 3 notifications patron
├── app/
│   ├── app/parametres/page.tsx      # + 4 champs modèle (nom, langue) par usage
│   └── admin/commerces/[id]/page.tsx # idem côté admin
└── app/actions/
    ├── business.ts            # + persistance whatsappTemplatesJson
    └── admin.ts                # idem côté admin

prisma/schema.prisma            # Business.whatsappTemplatesJson String @default("{}")
tests/unit/
└── whatsapp-templates.test.ts  # fenêtre 24h, choix template/texte, substitution variables
```

**Structure Decision**: Aucune nouvelle couche. Tout le travail se fait dans `src/lib/whatsapp/`, `src/lib/reminders.ts`, les server actions et écrans de réglages déjà existants.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Nouveau champ `whatsappTemplatesJson` sur `Business` | FR-004 : 4 modèles configurables par commerce | Modèles en dur dans le code : bloque tout nouveau commerce sans déploiement |
| Requête `Message` supplémentaire avant chaque envoi hors fenêtre | FR-001 : respecter la règle Meta des 24h | Ignorer la fenêtre : envois silencieusement rejetés en prod (le bug qu'on corrige) |

Post-design constitution : **PASS**.
