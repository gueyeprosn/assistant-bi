# Landing — overrides

Priorité sur MASTER pour la page `/` uniquement.

Le dashboard produit reste **minimal, fond blanc, sans verre**.  
Cette page marketing applique le style **Glassmorphism** (ui-ux-pro-max).

## Style (cette page)

**Glassmorphism** — verre dépoli, profondeur, source de lumière.

| Token | Valeur |
|-------|--------|
| Fond | Navy profond `#061428` → `#0B1F3A` + orbes or / blanc |
| Verre | `rgba(255,255,255,0.10–0.16)` + `backdrop-filter: blur(16px)` |
| Bord | `1px solid rgba(255,255,255,0.20)` + reflet haut |
| Texte | Blanc / `#E8EEF6` (contraste ≥ 4.5:1) |
| CTA | Or `#C9A84C` sur navy (accent skill, HEX métier) |

Palette skill `#2563EB` / `#EA580C` **refusée**. Navy + or inchangés.

Typo skill Plus Jakarta Sans **refusée**. Source Sans 3 (MASTER).

## Pattern

Hero + Features + CTA (skill) **sans vidéo**, **sans faux témoignages**.

1. Nav verre sticky + 2 CTA
2. Hero 2 colonnes : promesse + preview WhatsApp (LCP)
3. Preuves produit (24h/24, FR+WO, Wave/OM) — pas de logos inventés
4. Comment ça marche (3 cartes verre)
5. Fonctionnalités (6 cartes)
6. Trois formules + CTA bas
7. Comptes démo

## Motion

CSS only. Orbes lents, float 8–12px.  
`prefers-reduced-motion: reduce` → état final statique. Pas de GSAP.

## Interdit

Nav à 8 liens, slider, témoignages stock, logo Meta, anglais seul,  
IA purple, parallaxe hero, `translateY` au hover des boutons.
