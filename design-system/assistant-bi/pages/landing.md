# Landing — overrides

Priorité sur MASTER pour la page `/` uniquement.

Le dashboard produit reste **minimal, fond blanc**.  
Cette page marketing suit le style **Minimalism & Swiss** (ui-ux-pro-max), conversion SaaS — **pas de verre, pas de dark**.

Inspiration : landing SaaS moderne, claire, hiérarchie nette, CTA visibles
([référence UI/UX conversion](https://dribbble.com/services/122175-Modern-Landing-Page-UI-UX-Design)).

## Style (cette page)

| Token | Valeur |
|-------|--------|
| Fond | Blanc `#FFFFFF` + bandes `--soft` `#F4F6F9` |
| Texte | Navy `#0B1F3A` / muted `#4A5A6D` |
| CTA primaire | Or `#C9A84C` sur navy |
| CTA secondaire | Ghost 2 px navy |
| Cartes | Blanc, filet 1 px `#D7DEE8`, radius 16 px |
| Bande finale | Navy plein (pas un thème sombre) |

Palette skill `#2563EB` / `#EA580C` **refusée**. Navy + or inchangés.  
Typo skill Plus Jakarta Sans **refusée**. Source Sans 3 (MASTER).  
Glassmorphism **interdit** ici aussi.

## Pattern

Hero + Features + CTA (skill) **sans vidéo**, **sans faux témoignages**.

1. Nav blanche sticky + ancres (Marche, Tarifs) + 2 CTA
2. Hero 2 colonnes : promesse + preview WhatsApp (LCP)
3. Preuves produit (24h/24, FR+WO, Wave/OM)
4. Comment ça marche (3 étapes numérotées)
5. Fonctionnalités (6 cartes)
6. Trois formules, Standard mis en avant
7. FAQ courte (3 questions)
8. CTA navy + comptes démo

## Motion

CSS only, 150 ms opacity. Pas d’orbes, pas de float, pas de GSAP.  
`prefers-reduced-motion: reduce` déjà global.

## Interdit

Nav à 8 liens, slider, témoignages stock, logo Meta, anglais seul,  
IA purple, verre dépoli, parallaxe, `translateY` au hover des boutons.
