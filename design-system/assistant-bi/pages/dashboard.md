# Dashboard mobile — Assistant Bi

> Override de `MASTER.md` pour l’espace professionnel (`/login`, `/inscription`, `/app/*`).

## Public

Petits professionnels, Android entrée de gamme, 3G, maîtrise numérique limitée. Texte gros, boutons 52px, 4 onglets bas.

## Écrans

| Route | Rôle |
|-------|------|
| `/login` | Connexion téléphone + PIN |
| `/inscription` | Création d’espace, essai 7 jours |
| `/app` | KPI du jour, absents, barres 7 jours |
| `/app/calendrier` | RDV groupés par jour, fermer un créneau |
| `/app/messages` | Fil WhatsApp + **Transférer vers l’humain** |
| `/app/fiche` | Horaires, prestations, tarifs, messages bot |
| `/app/devis` | Devis **texte** WhatsApp, pas de PDF |
| `/app/relances` | Rappels J-1 + absents |
| `/app/abonnement` | 1 500 / 3 000 / 6 000 F · Wave / Orange Money |
| `/app/parametres` | FR/WO, clé WhatsApp, adresse à coller |

## Composants

`PageHeader`, `KpiCard`, `MiniBars` (CSS, pas de Chart.js), `CopyField`, `CopyQuote`, `AuthFrame`.

## Interdit

Jargon (API, webhook, token), PDF, animations lourdes, clichés Afrique, menus profonds.
