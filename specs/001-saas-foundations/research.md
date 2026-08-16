# Research: Fondations SaaS commercialisable

## 1. Hachage PIN

**Decision**: Nouveaux PIN en Argon2id (`@node-rs/argon2`). Vérification : Argon2 d’abord, sinon bcryptjs (hashes seed actuels). Rehash Argon2 après login bcrypt réussi.

**Rationale**: Constitution IV exige un hash irrécupérable type Argon2id. Les comptes démo existent déjà en bcrypt. Dual-read évite de casser `77 111 11 11` / `1234`. `@node-rs/argon2` fournit des binaires Windows + Linux (Vercel).

**Alternatives considered**: bcrypt seul (non conforme) ; argon2 natif `node-gyp` (fragile sur Windows) ; reset forcé de tous les PIN (casse la démo commerciale).

## 2. Sessions révocables

**Decision**: Cookie `ab_session` ne transporte plus le rôle métier : il porte `sessionId` signé (HMAC). Table `Session` : `id`, `userId`, `businessId`, `role`, `impersonationId?`, `expiresAt`, `revokedAt`. `logoutEverywhere` met `revokedAt` sur toutes les sessions du user.

**Rationale**: FR-004 déconnexion globale. Cookie HMAC actuel est stateless : vol ou multi-appareil non révocable. Garder HttpOnly, Secure (prod), SameSite=Lax, TTL 14 j.

**Alternatives considered**: JWT en cookie (plus gros, révocation = denylist = table quand même) ; iron-session (OK mais on a déjà HMAC maison — étendre plutôt que changer de lib).

## 3. Isolation multi-tenant

**Decision**: `getCurrentBusiness()` lit uniquement `session.businessId`. Toute query Prisma métier filtre `businessId` de ce contexte. Interdire `formData.businessId` sauf admin. Tests d’isolation : user A ne lit pas RDV/messages de B même avec un id volé.

**Rationale**: Déjà partiellement vrai via `requireOwner()`. Trous : admin impersonate pose `businessId` dans le cookie sans journal ; certaines actions pourraient accepter un id. Formaliser `src/server/policies.ts`.

**Alternatives considered**: Postgres RLS (trop tôt, SQLite local) ; middleware qui parse le body (fragile).

## 4. Moteur conversationnel

**Decision**: Garder `handleInbound` + règles FR/WO. Expliciter la machine à états dans `state.ts` (transitions autorisées seulement). LLM (`llmPolish` / `llmClassify`) **après** les faits métier ; si l’intent est `other` et aucun fait, handoff — jamais de phrase qui contient un nombre inventé. Détection langue existante conservée.

**Rationale**: Constitution III. Le moteur a déjà intents, parser, calendar. Il manque des transitions strictes et une garde anti-hallucination sur le polish.

**Alternatives considered**: Agent LLM-first (interdit) ; NLU externe (coût, 3G, hors MVP).

## 5. Double réservation

**Decision**: `bookSlot()` dans `src/server/services/booking.ts` : transaction Prisma, `isSlotFree` **dans** la transaction, insert. Statuts occupés : `pending`, `confirmed`/`booked`, `reminded` (pas `cancelled`/`no_show`/`completed`). SQLite : une réservation à la fois suffit à l’échelle Dakar ; documenter `Serializable` pour Postgres plus tard.

**Rationale**: Course entre deux clientes. Unique constraint SQL sur plage horaire est pénible (overlap). Transaction + relecture est le minimum fiable.

**Alternatives considered**: Unique `(businessId, startsAt)` trop naïf (durées variables) ; lock Redis (infra en trop).

## 6. Rappels J-1 idempotents

**Decision**: `updateMany` où `id = X AND reminderSentAt = null` puis envoi ; si `count === 0`, skip. Optionnel plus tard : table `Reminder` avec `@@unique([appointmentId, kind])`. Pour cette vague : le champ existant + update conditionnel suffit.

**Rationale**: Deux crons concurrents. Le code actuel fait find → send → update (fenêtre de double envoi).

**Alternatives considered**: Cron distribué / file SQS (overkill).

## 7. Abonnement

**Decision**: Une fonction `getSubscriptionStatus(business)` unique (dates serveur `Africa/Dakar`). Ne plus se fier au seul `status` string si `trialEndsAt` est passé — recalcul. `confirmPayment` MUST aussi poser `plan` (micro/standard/pro) depuis le paiement, pas seulement `status: active`.

**Rationale**: FR-014/015. Bug actuel : confirmation active le commerce sans lier le plan payé.

**Alternatives considered**: Table `Subscription` séparée dès maintenant (utile mais migration plus lourde) — **phase suivante**. Pour la vague 1 : champs Business + `SubscriptionEvent` d’audit.

## 8. Tests

**Decision**: Vitest + Prisma SQLite fichier `tests/tmp.db` ou `:memory:` via schema. Cas P1 : isolation, lockout PIN, overlap RDV, rappel idempotent, essai expiré.

**Rationale**: Aucun runner aujourd’hui. Constitution exige des tests critiques avant commercialisation. Playwright alourdit CI sans 3G réelle.

**Alternatives considered**: Jest (redondant) ; tests manuels seuls (insuffisant).

## 9. Impersonation

**Decision**: Formulaire motif obligatoire. Ligne `ImpersonationSession`. Cookie lié. TTL max 2 h. Bandeau existant conservé. Fin : `endedAt` + session admin restaurée (businessId null).

**Rationale**: FR-022. Aujourd’hui : un POST suffit, aucun motif.

**Alternatives considered**: Désactiver l’impersonation (bloque le commercial Dakar).

## 10. Completeness fiche

**Decision**: Fonction pure `ficheCompleteness(business)` : activité, adresse, ≥1 service, horaires, accueil FR, accueil WO → pourcentage. Afficher sur `/app/fiche`. Pas d’onboarding wizard multi-pages dans cette vague (la fiche existe).

**Rationale**: FR-019. Wizard 7 étapes = UX neuve ; indicateur sur l’écran actuel est le plus petit pas.

**Alternatives considered**: Wizard bloquant (risque de perdre les patrons déjà seedés).
