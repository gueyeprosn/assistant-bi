# Phase 0 Research: Modèles WhatsApp hors fenêtre 24h

## Décision 1 : stockage du mapping usage → modèle

**Decision**: Un seul champ `Business.whatsappTemplatesJson` (`String`, JSON, défaut `"{}"`), au format :

```json
{
  "reminder_j1": { "name": "rappel_rdv", "lang": "fr" },
  "new_appointment": { "name": "nouveau_rdv", "lang": "fr" },
  "handoff": { "name": "transfert_client", "lang": "fr" },
  "cancelled": { "name": "rdv_annule", "lang": "fr" }
}
```

**Rationale**: Même pattern que `hoursJson` déjà présent sur `Business` — un JSON string parsé côté serveur, pas de nouvelle table Prisma, pas de migration relationnelle. Le périmètre est fixe (4 usages connus), donc pas besoin de requêtabilité SQL sur les modèles.

**Alternatives considered**:
- Table `WhatsAppTemplate` (businessId, usage, name, lang) : rejetée — sur-ingénierie pour 4 clés fixes par commerce, ajoute une jointure partout où on lit un modèle, sans bénéfice (pas d'historique ni de versioning demandé).
- Variables d'environnement globales : rejetée — les modèles sont propres à chaque compte Meta (WABA) par commerce, pas globales à l'app.

## Décision 2 : calcul de la fenêtre de service (24h)

**Decision**: Au moment de l'envoi, requêter le dernier `Message` avec `direction: "inbound"` de la conversation du destinataire (`Conversation` liée à `businessId` + `customerId`, ou une conversation dédiée "patron" — voir Décision 3) et comparer `createdAt` à `Date.now() - 24h`.

**Rationale**: La fenêtre Meta se rouvre à chaque message entrant réel, pas à la réservation. Recalculer à l'envoi (pas au moment de créer le rendez-vous) est la seule façon d'être correct si le client réécrit entre-temps (Edge Case spec). L'index Prisma existant `[conversationId, createdAt]` rend la requête bon marché.

**Alternatives considered**: Stocker un `lastInboundAt` dénormalisé sur `Conversation` — rejeté pour ce périmètre : une requête indexée suffit, dénormaliser ajoute un point de désynchronisation à maintenir sans gain mesurable ici.

## Décision 3 : fenêtre pour les notifications patron

**Decision**: Les notifications patron (nouveau RDV, transfert, annulation) sont évaluées contre le dernier message **entrant du numéro `ownerPhone`** vers le business (même mécanique que pour un client : chercher/considérer la conversation associée à ce numéro côté `Message.direction === "inbound"`).

**Rationale**: Côté Meta, le patron est un destinataire WhatsApp comme un autre pour le numéro professionnel connecté — la fenêtre de 24h s'applique symétriquement, qu'il soit "client" ou "propriétaire" du commerce.

**Alternatives considered**: Toujours traiter les notifications patron comme prioritaires et forcer un modèle systématiquement (ignorer le calcul de fenêtre) — rejeté : dans les commerces qui utilisent activement le dashboard et discutent avec leurs clients via le même numéro, cela enverrait des modèles inutiles (moins soignés qu'un texte libre) alors que la fenêtre est ouverte.

## Décision 4 : forme de l'appel Graph API "template"

**Decision**: `cloudAdapter` expose une nouvelle méthode `sendTemplate(toPhone, { name, lang, params }, businessId)` qui poste :

```json
{
  "messaging_product": "whatsapp",
  "to": "...",
  "type": "template",
  "template": {
    "name": "...",
    "language": { "code": "fr" },
    "components": [{ "type": "body", "parameters": [{ "type": "text", "text": "..." }, ...] }]
  }
}
```

**Rationale**: Reprend le même pattern que `postCloud` existant (retry avec backoff, mêmes credentials `resolveCreds`). Un seul composant `body` avec paramètres positionnels couvre les 4 usages actuels (pas de bouton, pas d'en-tête média demandé par la spec).

**Alternatives considered**: Bibliothèque cliente Meta tierce — rejetée, l'existant fait déjà des appels `fetch` bruts vers Graph API sans dépendance, cohérent avec Constitution V (améliorer l'existant).

## Décision 5 : comportement quand aucun modèle n'est configuré

**Decision**: Fonction `resolveSendMode()` retourne soit `{ mode: "session" }`, soit `{ mode: "template", template }`, soit `{ mode: "skip" }`. Les appelants (`reminders.ts`, `notify-owner.ts`) sur `skip` journalisent (`console.warn` + `WebhookEvent`/log existant) et n'appellent pas Graph API.

**Rationale**: FR-006 exige de ne pas tenter un envoi voué à l'échec. Réutilise le pattern déjà présent (`if (!creds) { console.warn(...); return; }` dans `cloud.ts`) plutôt que d'introduire un nouveau système d'alerte.

**Alternatives considered**: Lever une exception bloquante — rejeté, casserait le cron pour tous les rendez-vous suivants (déjà un souci évité par le `try/catch` par rendez-vous existant, mais autant ne pas dépendre de ce filet).
