# Data Model: Fondations SaaS commercialisable

Évolution du schéma Prisma existant. Noms de tables/champs ci-dessous = cible ; les champs déjà présents sont marqués *(existe)*.

## Entities

### User *(existe)*
- `id`, `phone` unique, `pinHash`, `name`, `role` (`owner` | `admin` ; `staff` réservé, pas d’UI)
- `businessId` nullable (admin sans commerce)
- **Ajouter** : `failedPinAttempts` Int default 0, `lockedUntil` DateTime?, `pinAlgo` String default `bcrypt`

### Session *(nouveau)*
- `id` (id cookie), `userId`, `businessId`?, `role`, `impersonationId`?, `expiresAt`, `revokedAt`?, `createdAt`, `ip`?
- Relation : User 1—n Session
- Validation : `expiresAt` > now et `revokedAt` null pour être valide

### Business *(existe)*
- Identité, `hoursJson`, greetings, `plan`, `status`, `trialEndsAt`, Wave/OM, `ownerPhone`
- **Ajouter** : `timezone` default `Africa/Dakar`, `latePolicy`?, `cancellationPolicy`?, `minimumNoticeMin` Int default 60, `botTone` String default `simple`
- Statuts statutaires : `trial` | `active` | `past_due` | `suspended` | `cancelled` | `expired`
- Plans : `trial` | `micro` | `standard` | `pro`

### Service *(existe)*
- `name`, `durationMin`, `priceFcfa`, `keywordsJson`, `active`, `sortOrder`

### Customer *(existe)*
- `@@unique([businessId, phone])`, `language`

### Conversation *(existe)*
- `status` actuel `bot` | `handoff` — **mapper** vers : `open` (bot), `human`, `resolved` (conserver `bot`/`handoff` en v1 pour ne pas casser le seed, ajouter `resolved`)
- `stateJson` : `{ phase, intent?, serviceId?, date?, time? }`
- **Ajouter** : `lastIntent` String?, `language` String?

Phases autorisées : `new` → `understanding` → `collecting` → `confirming` → `completed` | `human` | `cancelled`

### Message *(existe)*
- `direction` inbound|outbound, `text`, `language`

### Appointment *(existe)*
- `startsAt`, `endsAt`, `status`, `reminderSentAt`
- **Ajouter** : `confirmedAt`, `cancelledAt`, `cancelReason`
- Statuts : `pending` | `booked` | `reminded` | `completed` | `cancelled` | `no_show`
- Occupé si status ∈ {pending, booked, reminded}

### Quote *(existe)*
- `linesJson`, `totalFcfa`, `textBody`, `status`
- **Ajouter** : `note`, `expiresAt`
- Statuts : `draft` | `sent` | `accepted` | `rejected` | `expired`

### BlockedSlot *(existe)*
- inchangé

### SubscriptionPayment *(existe)*
- **Ajouter** : `planId` (micro|standard|pro), `provider` (wave|om), `reference`, `confirmedByUserId`?, `rejectedAt`?
- Statuts : `pending` | `confirmed` | `rejected`

### SubscriptionEvent *(nouveau)*
- `businessId`, `type` (trial_start|trial_extend|activated|suspended|payment_confirmed), `payloadJson`, `actorUserId`?, `createdAt`

### AuditLog *(nouveau)*
- `actorUserId`, `businessId`?, `action`, `metadataJson`, `createdAt`
- Actions : `login_ok`, `login_fail`, `lockout`, `logout_all`, `payment_confirm`, `payment_reject`, `suspend`, `impersonate_start`, `impersonate_end`, `handoff`

### ImpersonationSession *(nouveau)*
- `adminUserId`, `businessId`, `reason` (min 8 chars), `startedAt`, `endedAt`?, `sessionId`

### Login n’est pas une table séparée : compteurs sur User + AuditLog.

### WebhookEvent *(nouveau, préparation Cloud)*
- `provider`, `externalId`, `payloadHash`, `status` (received|processed|ignored|error), `receivedAt`, `processedAt?`
- `@@unique([provider, externalId])`

## Relationships

```text
User 1—0..1 Business (owner/staff)
User 1—n Session
User 1—n ImpersonationSession (admin)
Business 1—n Service, Customer, Conversation, Appointment, Quote, Payment, Audit, SubscriptionEvent
Customer 1—n Conversation, Appointment, Quote
Appointment 0—1 reminder via reminderSentAt (pas de table Reminder dans cette vague)
```

## Validation rules

- Téléphone SN normalisé (`src/lib/phone.ts`)
- PIN 4–6 chiffres
- Prix ≥ 0, durée > 0
- `trialEndsAt` obligatoire si status trial
- Motif impersonation ≥ 8 caractères
- `businessId` des ressources = session.businessId (sauf admin)

## State transitions

### Appointment
`pending` → `booked` → `reminded` → `completed`  
`booked|reminded` → `cancelled` | `no_show`  
Interdit : `cancelled` → `booked` (créer un nouveau RDV)

### Conversation
`bot` → `handoff` → `bot` | `resolved`  
`bot` → `resolved`

### Payment
`pending` → `confirmed` | `rejected` (terminal)

### Subscription (dérivé)
`getSubscriptionStatus()` : si trial et now > trialEndsAt → `expired` (accès métier coupé, simulateur peut encore répondre « rappel plus tard » si suspendu)
