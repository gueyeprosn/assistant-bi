# Politique de confidentialité — Assistant Bi

**Responsable :** l’éditeur d’Assistant Bi (Dakar, Sénégal).  
**Autorité :** Commission de protection des Données personnelles (CDP), loi n° 2008-12.  
Ce texte est un modèle MVP. Un juriste sénégalais doit le relire avant tout lancement commercial.

## 1. Données collectées

- Professionnels : téléphone, nom, PIN (hash irrécupérable), fiche métier, horaires, tarifs.
- Clients finaux (pour le compte du professionnel) : numéro WhatsApp, prénom éventuel, messages, rendez-vous, devis.
- Technique : sessions, journaux d’audit, paiements d’abonnement.

Nous ne revendons pas ces données. Finalité : faire fonctionner la secrétaire WhatsApp (réponses, agenda, rappels, abonnement).

## 2. Base et consentement

Le professionnel ouvre un compte et accepte les CGU. Le client final écrit sur WhatsApp du professionnel : l’usage du canal vaut consentement opérationnel, décrit dans les CGU. Pas de marketing tiers.

## 3. Destinataires

Le professionnel voit uniquement les données de **son** commerce. L’équipe Assistant Bi (support, admin) n’y accède qu’avec motif journalisé. Prestataires techniques (hébergeur, WhatsApp Cloud si activé) : uniquement pour fournir le service.

## 4. Durées

| Données | Durée |
|---|---|
| Conversations / messages | 12 mois glissants, puis archive |
| Clients | Tant que le commerce est actif |
| Paiements confirmés | 5 ans (comptabilité) |
| Journaux d’audit | 24 mois minimum |
| Compte résilié | 30 jours de grâce, puis purge (sauf paiements) |

## 5. Droits

Accès, rectification, suppression : le professionnel via son espace ; le client final via le professionnel ou le support WhatsApp Assistant Bi. PIN oublié : l’opérateur réinitialise, pas d’e-mail.

## 6. Sécurité

PIN hashé (Argon2id), sessions HttpOnly, isolation des commerces, journaux des actions sensibles. Aucun secret dans les logs.

## 7. Contact

Support WhatsApp indiqué sur la landing et dans l’espace pro. Déclaration CDP à effectuer avant collecte à grande échelle.
