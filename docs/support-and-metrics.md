# Support et métriques

## Canal MVP

WhatsApp dédié : variable `SUPPORT_WHATSAPP` (ex. `+22177XXXXXXX`).  
Affiché sur la landing, `/app/plus`, `/admin/support`.

Pas de ticket e-mail. Le commercial Dakar surveille le numéro.

## Métriques dans `/admin`

| Indicateur | Lecture MVP |
|---|---|
| Activation | Commerces créés (proxy ; onboarding wizard hors vague) |
| Configuration ≥ 80 % | Fiches avec `ficheCompleteness` ≥ 80 |
| Conversion essai | `active` / (`trial` + `active` + `cancelled`) |
| Churn mois | Commerces `cancelled` ce mois |
| Taux de handoff | Conversations `handoff` / total |
| Paiements bloqués | `pending` depuis plus de 24 h |

Ces chiffres sont des totaux simples, pas un outil analytics externe.

## Cibles qualitatives

Le taux de handoff doit **baisser** à mesure que les fiches sont complètes.  
La conversion essai → payant se suit à la main avec les 3–5 pilotes Dakar.
