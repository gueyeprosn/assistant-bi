# Plan financier — Assistant Bi (Dakar)

Tous les montants sont en FCFA. Hypothèses du brief, pour le démarchage et le suivi.

## Formules

| Formule | Prix / mois | Mix cible (hypothèse) |
|---|---|---|
| Micro | 1 500 | 40 % |
| Standard | 3 000 | 45 % |
| Pro | 6 000 | 15 % |

Prix moyen pondéré ≈ **2 400 F / client / mois**.

## Revenus théoriques

| Clients | CA / mois |
|---|---|
| 100 | ~ 240 000 |
| 200 | ~ 480 000 |
| 350 | ~ 840 000 |

## Charges fixes MVP

| Poste | / mois |
|---|---|
| API WhatsApp (volume bas) | 25 000 |
| Hébergement + IA | 25 000 |
| Commercial terrain Dakar | 200 000 |
| **Total** | **250 000** |

Sans commercial (vous vendez vous-même) : 50 000 F de charges techniques.

## Seuil de rentabilité

- Avec commercial : ~ **105 clients** au mix ci-dessus (250 000 / 2 400).
- Sans commercial : ~ **21 clients**.

À 200 clients : 480 000 − 250 000 = **230 000 F** de bénéfice brut / mois.

La marge brute logicielle reste > 80 % : chaque client supplémentaire coûte surtout le volume de messages, pas un stock.

## Investissement initial

- Développement Cursor (ce repo) : temps fondateur
- Freelance local d’appoint (onboarding, traductions wolof) : 300 000–450 000
- Téléphone commercial + transport Dakar : ~ 50 000 / mois
- Compte Wave Business + éventuellement NINEA pour PayDunya

## Trésorerie à surveiller

1. Volume WhatsApp (coût par conversation Meta).
2. Appels OpenAI si la clé est activée (sinon le moteur règles est gratuit).
3. Impayés : coupure automatique après rappel.
