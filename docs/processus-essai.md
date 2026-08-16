# Processus essai 7 jours → abonnement

## J0 — Sur place

1. Prospect accepte l’essai.
2. Remplir la [fiche d’onboarding](./fiche-onboarding.md).
3. Créer le commerce dans le back-office (ou seed / formulaire interne).
4. Connecter le numéro (simulateur en MVP ; API WhatsApp ensuite).
5. Formation 10–15 min.
6. Envoyer un message test depuis un second téléphone.

## J1 et J3

Message WhatsApp du commercial :

> « Naka waxtu wi ? Est-ce que le bot a déjà pris un rendez-vous ? Si un client pose une question bizarre, dites-lui d’écrire *patron*. »

## J6

Rappel :

> « Demain l’essai se termine. Pour continuer : Wave 3 000 F au 77 … (formule Standard). Sans engagement, on peut couper quand vous voulez. »

## J7

- Si payé : marquer le paiement **confirmé** dans `/admin` → statut *Actif*.
- Si pas payé : un rappel, 48 h de grâce (`past_due`), puis **Suspendu** (le bot s’arrête).

## Coupure

Le bot répond : *« Ce numéro n’accepte plus les messages automatiques pour le moment. »*  
Le patron garde son WhatsApp. Rien n’est « volé ».
