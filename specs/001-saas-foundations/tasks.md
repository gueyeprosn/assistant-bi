# Tasks: Fondations SaaS commercialisable

**Input**: Design documents from `/specs/001-saas-foundations/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Inclus (constitution + SC-003/005/006/007). Écrire les tests listés **avant** le code de la story, vérifier qu’ils échouent, puis implémenter.

**Organization**: Par user story. MVP = Phase 1 + 2 + US1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallèle (fichiers différents, pas de dépendance inachevée)
- **[Story]**: US1…US6
- Chaque description contient un chemin de fichier

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dossiers et outillage sans changer le métier

- [x] T001 Créer `src/server/services/`, `src/lib/auth/`, `tests/unit/`, `tests/isolation/` (fichiers `.gitkeep` si vide)
- [x] T002 Ajouter Vitest et `@node-rs/argon2` dans `package.json` (script `test`)
- [x] T003 [P] Exiger `SESSION_SECRET` non vide dans `.env.example` (supprimer le secret de secours documenté)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schéma + helpers partagés. **Bloque** toutes les user stories.

- [x] T004 Étendre `prisma/schema.prisma` : Session, AuditLog, ImpersonationSession, SubscriptionEvent, WebhookEvent ; User `failedPinAttempts`, `lockedUntil`, `pinAlgo` ; Appointment `confirmedAt`, `cancelledAt`, `cancelReason` ; SubscriptionPayment `planId`, `provider`, `reference`, `confirmedByUserId` ; Conversation `lastIntent`
- [x] T005 `npx prisma generate` + `npx prisma db push` + `npm run db:seed` toujours verts (`prisma/seed.ts`)
- [x] T006 Implémenter rôles/permissions dans `src/lib/auth/permissions.ts`
- [x] T007 Implémenter `getCurrentUser` / `getCurrentBusiness` / refus d’un `businessId` client dans `src/server/policies.ts`
- [x] T008 Implémenter `writeAudit` dans `src/server/services/audit.ts`
- [x] T009 Implémenter `getSubscriptionStatus()` (dates `Africa/Dakar`) dans `src/lib/plans.ts`
- [x] T010 Helper d’erreur JSON `{ success, error.code, error.message }` dans `src/lib/api-error.ts`
- [x] T011 Faire échouer le démarrage auth si `SESSION_SECRET` manquant (prod) dans `src/lib/auth.ts`

**Checkpoint**: seed + types Prisma OK. Stories possibles.

---

## Phase 3: User Story 1 - Connexion isolée (Priority: P1) 🎯 MVP

**Goal**: PIN durci, sessions révocables, un commerce = une session, lockout, logout partout.

**Independent Test**: Login salon vs garage ; URL de l’autre commerce illisible ; 5 PIN faux → lockout ; logout everywhere.

### Tests

- [x] T012 [P] [US1] Test d’isolation tenant dans `tests/isolation/tenant.test.ts`
- [x] T013 [P] [US1] Test lockout PIN dans `tests/unit/pin-lockout.test.ts`

### Implementation

- [x] T014 [US1] Argon2id + fallback bcrypt dans `src/lib/auth/pin.ts`
- [x] T015 [US1] Store Session (cookie = sessionId signé) dans `src/lib/auth/session.ts`
- [x] T016 [US1] Brancher login lockout + audit + rehash dans `src/lib/auth.ts` (`loginWithPhonePin`)
- [x] T017 [US1] `logoutEverywhereAction` dans `src/app/actions/auth.ts`
- [x] T018 [US1] Middleware : cookie **valide** (pas seulement présent) dans `src/middleware.ts`
- [x] T019 [US1] Toutes les actions patron filtrent le commerce session dans `src/app/actions/business.ts`

**Checkpoint**: US1 testable seule (isolation + lockout).

---

## Phase 4: User Story 2 - Secrétaire WhatsApp fiable (Priority: P1)

**Goal**: Faits métier seulement, états contrôlés, handoff, simulateur inchangé.

**Independent Test**: `/demo` tarif vrai ; question hors fiche → transfert ; pas de prix inventé.

### Tests

- [x] T020 [P] [US2] Test « pas d’hallucination tarif » dans `tests/unit/bot-facts.test.ts`

### Implementation

- [x] T021 [US2] Transitions d’état strictes dans `src/lib/bot/state.ts`
- [x] T022 [US2] Garde LLM (faits d’abord, sinon handoff) dans `src/lib/bot/engine.ts`
- [x] T023 [US2] Persister `lastIntent` dans `src/lib/bot/engine.ts`
- [x] T024 [US2] Handoff / reprendre / clôturer alignés contrats dans `src/app/actions/business.ts`

**Checkpoint**: Démo FR/WO + handoff sans invention.

---

## Phase 5: User Story 3 - Agenda et rappels (Priority: P1)

**Goal**: Une fonction de dispo, pas de double booking, rappel J-1 une seule fois.

**Independent Test**: Même créneau refusé ; cron rappel deux fois → un envoi.

### Tests

- [x] T025 [P] [US3] Test overlap dans `tests/unit/booking.test.ts`
- [x] T026 [P] [US3] Test rappel idempotent dans `tests/unit/reminders.test.ts`

### Implementation

- [x] T027 [US3] `bookSlot()` transactionnel dans `src/server/services/booking.ts`
- [x] T028 [US3] Brancher le bot sur `bookSlot` dans `src/lib/bot/engine.ts`
- [x] T029 [US3] `updateMany` conditionnel `reminderSentAt: null` dans `src/lib/reminders.ts`
- [x] T030 [US3] Renseigner `confirmedAt` / `cancelledAt` / `cancelReason` dans `src/app/actions/business.ts`
- [x] T031 [US3] Cron : JSON d’erreur standard dans `src/app/api/cron/reminders/route.ts`

**Checkpoint**: SC-005 et SC-006.

---

## Phase 6: User Story 4 - Essai et abonnement (Priority: P2)

**Goal**: Vérité serveur ; paiement manuel lie le **plan** ; accès coupé si expiré/suspendu.

**Independent Test**: `trialEndsAt` passé → pas d’agenda ; paiement pending n’active pas ; confirm admin → plan Standard.

### Tests

- [x] T032 [P] [US4] Test essai expiré dans `tests/unit/subscription.test.ts`

### Implementation

- [x] T033 [US4] `requestManualPayment` enregistre `planId` dans `src/app/actions/business.ts`
- [x] T034 [US4] Service billing + `SubscriptionEvent` dans `src/server/services/billing.ts`
- [x] T035 [US4] `confirmPayment` pose `plan` + `confirmedByUserId` + audit dans `src/app/actions/admin.ts`
- [x] T036 [US4] Couper `/app` hors billing si statut expiré/suspendu dans `src/app/app/layout.tsx`

**Checkpoint**: SC-007 ; plus de `active` sans plan.

---

## Phase 7: User Story 5 - Quotidien téléphone (Priority: P2)

**Goal**: Accueil utile, % config fiche, FR|WO, 375 px (landing déjà OK).

**Independent Test**: `/app/fiche` affiche un % ; accueil montre RDV + files ; WO sans mélange.

- [x] T037 [P] [US5] `ficheCompleteness()` dans `src/lib/fiche.ts`
- [x] T038 [US5] Afficher le % et vocabulaire métier dans `src/app/app/fiche/page.tsx`
- [x] T039 [US5] Accueil : totaux du jour (messages, RDV, handoff) dans `src/app/app/page.tsx`
- [x] T040 [US5] Clés i18n % / files d’attente dans `src/lib/i18n.ts`

**Checkpoint**: SC-002 / SC-008 sur `/app` (pas la landing).

---

## Phase 8: User Story 6 - Back-office cadré (Priority: P2)

**Goal**: Motif d’impersonation, journal, admin inaccessible en vue patron.

**Independent Test**: Impersonation sans motif refusée ; bandeau ; retour admin ; trace visible.

- [x] T041 [US6] Formulaire motif + création `ImpersonationSession` dans `src/app/admin/page.tsx` et `src/app/actions/admin.ts`
- [x] T042 [US6] `endImpersonation` dans `src/app/actions/admin.ts`
- [x] T043 [US6] Liste d’audit (paiements, impersonations) dans `src/app/admin/page.tsx`
- [x] T044 [US6] Refuser `/admin` pendant impersonation dans `src/app/admin/layout.tsx`

**Checkpoint**: SC-009.

---

## Phase 9: Polish & Cross-Cutting

- [x] T045 Enregistrer `WebhookEvent` (dédup) dans `src/app/api/webhooks/whatsapp/route.ts`
- [x] T046 [P] Audit technique court dans `docs/technical-audit.md`
- [x] T047 [P] Documenter `npm test` dans `README.md`
- [x] T048 Exécuter les scénarios de `specs/001-saas-foundations/quickstart.md`
- [x] T049 Vérifier qu’aucun livrable n’écrit « SecrétAIRE Local » (grep `src/`, `docs/`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)** : immédiat
- **Foundational (2)** : après 1 — **bloque** US1–US6
- **US1 → US2 → US3** : P1 séquentiel recommandé (auth puis bot puis agenda)
- **US4, US5, US6** : après US1 (session/admin) ; US4 avant US6 (paiements)
- **Polish** : après les stories visées

### User Story Dependencies

- **US1** : après Phase 2 — aucune autre story
- **US2** : après Phase 2 ; isolation US1 souhaitée pour ne pas tester le bot cross-tenant
- **US3** : bot US2 pour réserver via `/demo`
- **US4** : session US1
- **US5** : session US1
- **US6** : US1 + US4 (confirmer un paiement)

### Parallel Opportunities

- T003 // T001
- T012 // T013 (après T005)
- T020 // T021 (fichiers différents ; T022 dépend de T021)
- T025 // T026
- T037 // T040
- T046 // T047

### Parallel Example: User Story 1

```text
Task: tests/isolation/tenant.test.ts
Task: tests/unit/pin-lockout.test.ts
# puis séquentiel : pin.ts → session.ts → auth.ts → actions → middleware → business.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + 2
2. US1
3. **STOP** : isolation salon/garage + lockout
4. Ensuite US2 (promesse WhatsApp) puis US3 (créneaux)

### Incremental Delivery

US1 vendable en confiance interne → US2 démo terrain → US3 zéro double booking → US4 cash → US5 UX fiche → US6 ops.

---

## Notes

- Ne pas réécrire la landing glassmorphism
- Ne pas brancher WhatsApp Cloud réel ni PayDunya live
- `handleInbound` reste le seul moteur ; `/demo` et le webhook futur l’appellent
- Format checklist respecté : checkbox, Txxx, [P] optionnel, [USn] sur les stories, chemin fichier

---

## Phase 10: Convergence

Écarts constatés après `/speckit-implement` (T001–T049). Ne pas renuméroter les tâches précédentes.

- [x] T050 CRITICAL Journaliser le handoff (`writeAudit` action `handoff`) dans `src/lib/bot/engine.ts` per FR-024 / Constitution DoD (`missing`)
- [x] T051 Restaurer `reminderSentAt` si l’envoi échoue dans `src/lib/reminders.ts` per FR-012 / Edge rappels 3G (`partial`)
- [x] T052 Exposer et enregistrer les règles (retard, annulation, préavis) dans `src/app/app/fiche/page.tsx` et `src/app/actions/business.ts` per FR-019 (`partial`)
- [x] T053 Limiter la session d’impersonation (TTL court) dans `src/lib/auth/session.ts` et `src/app/actions/admin.ts` per FR-022 / Edge onglet fermé (`partial`)
- [x] T054 [P] Tester l’isolation Prisma salon vs garage dans `tests/isolation/tenant.test.ts` per SC-003 (`partial`)
- [x] T055 Appliquer un délai progressif avant le verrouillage 15 min dans `src/lib/auth/pin.ts` per FR-004 (`partial`)
- [x] T056 Persister `note` et `expiresAt` (7 j) à la création de devis dans `src/app/actions/business.ts` per FR-013 (`partial`)
- [x] T057 Enregistrer `provider` Wave/OM (pas seulement `channel`) dans `src/app/actions/business.ts` per FR-016 (`partial`)
- [x] T058 Vérifier la signature Meta si `WHATSAPP_APP_SECRET` est défini dans `src/app/api/webhooks/whatsapp/route.ts` per plan: http.md (`missing`)
- [x] T059 Permettre à l’opérateur de réinitialiser un PIN dans `src/app/actions/admin.ts` et `src/app/admin/page.tsx` per Assumptions / FR-002 (`missing`)
