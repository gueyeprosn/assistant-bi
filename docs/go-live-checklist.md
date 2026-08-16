# Go-live — lancement commercial Dakar

Avant le **premier client payant réel** :

- [ ] PIN jamais en clair ; login testé sur l’URL de production
- [ ] Isolation salon vs garage (2 commerces réels, URL croisée)
- [ ] Paiement Wave ou OM déclaré puis confirmé dans `/admin`
- [ ] Politique de confidentialité, CGU, CGV liées depuis la landing
- [ ] Numéro support WhatsApp allumé et lu au moins 2× / jour
- [ ] Sauvegarde PostgreSQL restaurée au moins une fois (`docs/deployment.md`)
- [ ] Alerte minimale : erreurs serveur + paiements pending > 24 h (vue admin)
- [ ] Panne LLM simulée (`OPENAI_API_KEY` retiré) : le bot répond encore par règles
- [ ] Guide simple envoyé aux 3–5 professionnels pilotes
- [ ] Déclaration / dossier CDP engagé si collecte au-delà du pilote

**Recommandation :** 3 à 5 pilotes Médina / Pikine / Almadies avant ouverture large.
