# Data Model: Modèles WhatsApp hors fenêtre 24h

## Entité modifiée : `Business`

Nouveau champ, aucun autre changement de schéma :

| Champ | Type | Défaut | Description |
|---|---|---|---|
| `whatsappTemplatesJson` | `String` | `"{}"` | JSON — mapping usage → `{ name, lang }` du modèle Meta approuvé pour ce commerce |

### Forme du JSON (validée côté application, pas côté Prisma)

```ts
type WhatsAppTemplateUsage = "reminder_j1" | "new_appointment" | "handoff" | "cancelled";

type WhatsAppTemplateMapping = Partial<Record<WhatsAppTemplateUsage, {
  name: string;   // nom exact du modèle approuvé dans Meta Business Manager
  lang: string;   // code langue Meta, ex. "fr", "fr_FR" — tel qu'approuvé
}>>;
```

Règles de validation (appliquées dans les server actions, pas en base) :
- `name` non vide si l'entrée existe pour un usage.
- `lang` non vide si l'entrée existe.
- Une entrée absente ou incomplète pour un usage ⇒ `resolveSendMode()` renverra `{ mode: "skip" }` pour cet usage hors fenêtre (FR-006).

## Entité dérivée (non stockée) : Fenêtre de service

Calculée à la demande, pas persistée :

```ts
type ServiceWindow = {
  isOpen: boolean;        // dernier message entrant < 24h
  lastInboundAt: Date | null;
};
```

Source : `Message` où `direction = "inbound"`, jointe via `Conversation.businessId` + `Conversation.customerId` (ou le numéro `ownerPhone` pour les notifications patron — voir research.md Décision 3).

## Pas de nouvelle table

Conformément à research.md (Décision 1), aucune table `WhatsAppTemplate` n'est créée : le mapping tient dans un champ JSON sur `Business`, cohérent avec `hoursJson` déjà présent sur le même modèle.

## Migration

```bash
npx prisma db push   # ajoute Business.whatsappTemplatesJson (SQLite local)
# En prod (Postgres/Neon) : migration additive, colonne nullable avec défaut — sans downtime
```

Aucune donnée existante à transformer : tous les commerces démarrent avec `"{}"` (aucun modèle configuré ⇒ comportement actuel préservé tant que la fenêtre est ouverte ; `skip` documenté hors fenêtre jusqu'à configuration).
