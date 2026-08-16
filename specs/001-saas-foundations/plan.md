# Implementation Plan: Fondations SaaS commercialisable

**Branch**: `001-saas-foundations` | **Date**: 2026-08-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-saas-foundations/spec.md`

## Summary

Renforcer le MVP Assistant Bi déjà en production locale pour qu’il soit **vendable à Dakar** : isolation des commerces, sessions révocables, PIN durci, secrétaire qui n’invente rien, agenda sans double réservation, rappels idempotents, abonnement/paiements manuels audités, back-office d’impersonation cadré. Approche : **étendre** `src/lib/*`, Prisma et les server actions existants — pas de second produit, pas de refonte landing.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Next.js 16 App Router, React 19

**Primary Dependencies**: Prisma 6, Tailwind 4, Zod 4, bcryptjs (lecture des PIN existants), `@node-rs/argon2` (nouveaux PIN), Vitest (tests)

**Storage**: SQLite local (`file:./dev.db`) ; schéma Prisma compatible PostgreSQL (pas d’extensions SQLite-only)

**Testing**: Vitest pour domaine (auth, calendrier, rappels, isolation). Pas de Playwright dans cette vague (3G / CI légère)

**Target Platform**: Navigateur mobile Android (375 px+), Node sur Vercel en prod visée

**Project Type**: Application web monolithique (UI + server actions + quelques routes API)

**Performance Goals**: Premier écran utile `/app` < 3 s sur 3G ; réponse bot règles < 1 s sans LLM

**Constraints**: Boutons ≥ 48 px ; FR|WO séparés ; cookies HttpOnly/Secure/SameSite=Lax ; pas de secret dans le git ; landing glassmorphism inchangée

**Scale/Scope**: Dizaines de commerces Dakar d’abord ; 2 comptes seed + 1 admin ; ~15 écrans existants à durcir, pas 50 écrans neufs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Gate | Statut |
|---|---|---|
| I. Produit avant techno | Pas de jargon IA, dashboard quotidien simple, nom Assistant Bi | PASS — on durcit, on n’ajoute pas d’analytics complexes |
| II. Isolation | `businessId` uniquement depuis la session | PASS — `requireOwner` / policies ; interdiction query client |
| III. Vérité métier | LLM jamais source de prix/horaires | PASS — polish optionnel après faits ; handoff si inconnu |
| IV. Vérité serveur | essai, plan, PIN, rappels, paiements | PASS — `getSubscriptionStatus()`, sessions en base, cron transactionnel |
| V. Améliorer l’existant | pas de rewrite | PASS — pas de `src/features` big-bang ; `src/server` seulement pour le nouveau |

Hors MVP (voix, PDF, SMS, Cloud réel, multi-sites) : **non implémenté**. Abstractions `WhatsAppAdapter` / paiement manuel **conservées**.

## Project Structure

### Documentation (this feature)

```text
specs/001-saas-foundations/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── http.md
│   └── server-actions.md
└── tasks.md                 # /speckit-tasks — pas ce livrable
```

### Source Code (repository root)

```text
src/
├── app/                     # routes existantes / /demo /login /app /admin + API
├── components/              # UI existante (AppShell, landing, simulateur)
├── lib/
│   ├── auth.ts              # à scinder progressivement
│   ├── auth/                # NOUVEAU : session store, lockout, permissions
│   ├── bot/                 # engine, intents, state — à durcir
│   ├── calendar.ts          # checkAvailability unique
│   ├── plans.ts             # + getSubscriptionStatus()
│   ├── reminders.ts         # update conditionnel idempotent
│   ├── whatsapp/            # adapter inchangé
│   └── payments/
├── server/                  # NOUVEAU, mince
│   ├── services/            # booking, billing, audit
│   └── policies.ts
└── middleware.ts            # cookie présent → plus tard session valide

prisma/schema.prisma
prisma/seed.ts
tests/
├── unit/
└── isolation/
```

**Structure Decision**: Monolithe Next existant. Ajouter `src/server` et `src/lib/auth/` sans déplacer tout `src/app`. Tests Vitest à la racine `tests/`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Table `Session` en plus du cookie HMAC | Déconnexion globale (FR-004) | Cookie seul : impossible d’invalider les autres appareils |
| Argon2id + fallback bcrypt | Constitution IV + comptes seed déjà hashés bcrypt | Tout recréer les PIN seed casse la démo terrain |
| Tables AuditLog / ImpersonationSession | FR-022 / FR-024 | Logs fichier : pas consultables dans `/admin` |
| `src/server/services` | Constitution : logique hors écrans | Tout laisser dans `actions/*.ts` empêche les tests d’isolation |

Post-design constitution : **PASS** (ces ajouts servent des MUST, pas du prestige).
