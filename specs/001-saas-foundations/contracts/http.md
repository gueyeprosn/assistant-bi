# HTTP contracts

Routes existantes à durcir. Corps JSON, erreurs :

```json
{ "success": false, "error": { "code": "STRING", "message": "humain FR/WO selon cookie" } }
```

Jamais de stack trace.

## `POST /api/demo/chat`

Simulateur client. Auth : aucune (démo publique).

Request:

```json
{ "businessId": "<id seed>", "text": "string", "phone": "optional" }
```

`businessId` ici est **volontaire** : c’est le choix du commerce dans le simulateur, pas une élévation de privilège dashboard.

Response 200:

```json
{ "success": true, "replies": ["..."], "handoff": false }
```

Errors: `BUSINESS_NOT_FOUND`, `BUSINESS_SUSPENDED`, `TEXT_REQUIRED`

## `GET /api/demo/thread?businessId=`

Fil de démo. Même règle : id choisi pour la démo.

## `GET /api/demo/businesses`

Liste publique des commerces seed (nom, id) pour le sélecteur démo.

## `GET /api/cron/reminders?secret=`

Header ou query `secret` = `CRON_SECRET`.  
200: `{ "success": true, "sent": n, "checked": n }`  
401: `CRON_UNAUTHORIZED`

Idempotence : voir data-model (update conditionnel).

## `GET/POST /api/webhooks/whatsapp`

Préparé, inactif sans tokens. GET verify Meta. POST : enregistrer `WebhookEvent` (dédup `externalId`) puis `handleInbound`. Signature obligatoire en prod si secret présent ; en local sans secret → 503 `WHATSAPP_NOT_CONFIGURED` (pas d’ouverture).

## `POST /api/webhooks/paydunya`

Stub : 200 ignoré tant que les clés sont vides.

## Pages (non JSON)

| Path | Auth |
|---|---|
| `/` | public |
| `/demo` | public |
| `/login` | public |
| `/app/*` | session owner (ou admin impersonating) + abonnement non coupé sauf écran billing |
| `/admin/*` | role admin réel, pas impersonation |
