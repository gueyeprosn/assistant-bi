# Tasks: Modèles WhatsApp hors fenêtre 24h

**Input**: Design documents from `/specs/002-whatsapp-templates/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Inclus (calcul de fenêtre + choix template/texte = cœur de la fonctionnalité, testable sans credentials Meta réels).

**Organization**: Par user story. MVP = Phase 1 + 2 + US1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallèle (fichiers différents, pas de dépendance inachevée)
- **[Story]**: US1…US3
- Chaque description contient un chemin de fichier

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Ajouter `Business.whatsappTemplatesJson String @default("{}")` dans `prisma/schema.prisma`
- [x] T002 `npx prisma generate` + `npx prisma db push` + `npm run db:seed` toujours verts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Calcul de fenêtre + résolution du mode d'envoi. **Bloque** toutes les user stories.

- [x] T003 [P] `getServiceWindow(businessId, recipientPhone)` dans `src/lib/whatsapp/window.ts` (contracts/whatsapp-templates.md)
- [x] T004 [P] `parseTemplateMapping()` + types `WhatsAppTemplateUsage` dans `src/lib/whatsapp/templates.ts`
- [x] T005 `resolveSendMode(businessId, recipientPhone, usage)` dans `src/lib/whatsapp/templates.ts` (dépend de T003, T004)
- [x] T006 `cloudAdapter.sendTemplate()` dans `src/lib/whatsapp/cloud.ts` (retry/backoff identiques à `sendText`)

**Checkpoint**: `resolveSendMode` + `sendTemplate` disponibles et testés isolément.

---

## Phase 3: User Story 1 - Le rappel J-1 arrive vraiment chez la cliente (Priority: P1) 🎯 MVP

**Goal**: `sendJ1Reminders()` choisit texte libre vs modèle vs skip selon la fenêtre de 24h.

**Independent Test**: Rendez-vous demain sans message client récent + modèle configuré → appel `sendTemplate` ; avec message récent → `sendText` ; sans modèle configuré → aucun appel, log.

### Tests

- [x] T007 [P] [US1] Tests `resolveSendMode` (session / template / skip) dans `tests/unit/whatsapp-templates.test.ts`
- [x] T008 [P] [US1] Test rappel J-1 hors fenêtre utilise le modèle dans `tests/unit/reminders.test.ts`

### Implementation

- [x] T009 [US1] Brancher `resolveSendMode` + `sendTemplate`/`sendText`/skip dans `sendJ1Reminders()` (`src/lib/reminders.ts`)
- [x] T010 [US1] Ne pas marquer `reminderSentAt` sur `skip` (garder l'appointment repêchable) dans `src/lib/reminders.ts`

**Checkpoint**: US1 testable seule — rappel J-1 fiable hors fenêtre.

---

## Phase 4: User Story 2 - Le patron est notifié même hors fenêtre (Priority: P1)

**Goal**: Les 3 notifications patron (`notify-owner.ts`) respectent la même logique fenêtre/modèle/skip.

**Independent Test**: Nouveau RDV / handoff / annulation avec patron hors fenêtre + modèle configuré → `sendTemplate` ; patron dans la fenêtre → `sendText`.

### Tests

- [x] T011 [P] [US2] Tests des 3 notifications patron (fenêtre fermée/ouverte) dans `tests/unit/whatsapp-templates.test.ts`

### Implementation

- [x] T012 [US2] Brancher `resolveSendMode` dans `notifyOwnerNewAppointment` (`src/lib/whatsapp/notify-owner.ts`, usage `new_appointment`)
- [x] T013 [US2] Idem dans `notifyOwnerHandoff` (usage `handoff`)
- [x] T014 [US2] Idem dans `notifyOwnerAppointmentCancelled` (usage `cancelled`)

**Checkpoint**: US1 + US2 — tous les envois hors moteur conversationnel respectent la fenêtre Meta.

---

## Phase 5: User Story 3 - L'opérateur configure les modèles sans déploiement (Priority: P2)

**Goal**: Formulaires `/app/parametres` et `/admin/commerces/[id]` pour saisir les 4 mappings.

**Independent Test**: Saisir un nom de modèle depuis `/admin/commerces/[id]`, sauvegarder, vérifier qu'un envoi hors fenêtre suivant l'utilise.

### Implementation

- [x] T015 [P] [US3] 4 champs (nom + langue) sous la section WhatsApp de `src/app/app/parametres/page.tsx`
- [x] T016 [US3] Persister `whatsappTemplatesJson` dans l'action correspondante de `src/app/actions/business.ts` (valider via `parseTemplateMapping`)
- [x] T017 [P] [US3] Mêmes champs dans `src/app/admin/commerces/[id]/page.tsx`
- [x] T018 [US3] Persister côté admin dans `src/app/actions/admin.ts`

**Checkpoint**: SC-003 — configuration sans déploiement.

---

## Phase 6: Polish & Cross-Cutting

- [x] T019 [P] Documenter les modèles requis (usage, variables attendues) dans `docs/whatsapp-coexistence.md`
- [x] T020 Exécuter les scénarios de `specs/002-whatsapp-templates/quickstart.md`
- [x] T021 Vérifier que `npm test` reste vert dans son ensemble (non-régression `bot-facts.test.ts`, `reminders.test.ts` existants)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)** : immédiat
- **Foundational (2)** : après 1 — **bloque** US1–US3
- **US1 → US2** : P1 séquentiel recommandé (rappel client avant notifications patron, mêmes primitives)
- **US3** : après US1 (les champs de config n'ont de sens qu'une fois le comportement d'envoi branché)
- **Polish** : après les stories visées

### Parallel Opportunities

- T003 // T004 (fichiers différents)
- T007 // T008
- T011 seule (un seul fichier de test, 3 sous-cas)
- T015 // T017 (écrans différents)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + 2
2. US1
3. **STOP** : rappel J-1 fiable hors fenêtre, validé par `npm test -- whatsapp-templates`
4. Ensuite US2 (notifications patron) puis US3 (config sans déploiement)

### Incremental Delivery

US1 débloque la promesse produit centrale (rappel J-1) → US2 fiabilise le dashboard patron → US3 rend la fonctionnalité opérable sans intervention développeur.

---

## Notes

- Ne pas implémenter l'Embedded Signup Meta ni la coexistence (hors périmètre spec.md).
- `cloudAdapter.sendText` reste le chemin utilisé par le moteur conversationnel synchrone (`handleInbound` répond toujours dans la fenêtre ouverte par le message entrant qui le déclenche) — aucun changement là.
- Format checklist respecté : checkbox, Txxx, [P] optionnel, [USn] sur les stories, chemin fichier.
