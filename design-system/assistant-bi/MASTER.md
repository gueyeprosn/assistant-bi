# Design System Master File — Assistant Bi

> **LOGIC:** When building a page, first check `design-system/assistant-bi/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Assistant Bi  
**Generated:** 2026-08-16 (UI UX Pro Max v2)  
**Category:** B2B SaaS · secrétaire IA WhatsApp · Dakar  
**Design Dials:** Variance 3/10 (Minimal) | Motion 2/10 (Subtle) | Density 3/10 (Spacious)

**Override moteur :** le skill a proposé une palette « AI purple » (`#7C3AED`). **Interdite.** Charte métier verrouillée : navy confiance + or doux + blanc, pour un B2B sénégalais payant, smartphones entrée de gamme, 3G.

---

## Nom

**Assistant Bi** uniquement. Ne jamais écrire « SecrétAIRE Local » sur un livrable.

---

## Global Rules

### Color Palette (verrouillée)

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|--------|
| Primary | `#0B1F3A` | `--navy` / `--color-primary` | Boutons, titres, header |
| Primary 2 | `#16345C` | `--navy-2` | Hover |
| On Primary | `#FFFFFF` | `--color-on-primary` | Texte sur navy |
| Accent | `#C9A84C` | `--gold` | Toggle FR/WO, CTA secondaire, liseré |
| Accent 2 | `#D4B96A` | `--gold-2` | Hover or |
| On Accent | `#0B1F3A` | `--color-on-accent` | Texte sur or |
| Background | `#FFFFFF` | `--bg` | Fond unique (light only) |
| Foreground | `#0B1F3A` | `--ink` | Texte |
| Muted | `#4A5A6D` | `--muted` | Secondaire |
| Soft | `#F4F6F9` | `--soft` | Zones alternées |
| Card | `#FFFFFF` | `--card` | Cartes |
| Border | `#D7DEE8` | `--line` | Filets 1px |
| Destructive | `#B42318` | `--destructive` | Annuler uniquement |
| Ring / focus | `#C9A84C` | `--gold` | Focus visible |

WhatsApp `#075E54` = **simulateur de chat seulement**, jamais couleur de marque.

### Typography

Une seule famille UI (lisibilité, low-literacy) :

- **UI :** Source Sans 3, 400 / 600 / 700
- Corps **17px**, interligne **1.45**
- Titres 28–40px, gras, navy
- Pas de serif décoratif dans le produit
- Wordmark logo : Source Sans 3 Bold, tracking serré

### Spacing

*Density 3/10 — Spacious*

| Token | Value |
|-------|-------|
| `--space-sm` | `8px` |
| `--space-md` | `24px` |
| `--space-lg` | `32px` |
| `--space-xl` | `48px` |
| `--space-2xl` | `64px` |

Tap target **minimum 48px**. Radius boutons/cartes **12–16px**.

### Shadows

Aucune ombre lourde. Filet 1px `--line` seulement (3G, Android bas de gamme).

---

## Component Specs

### Buttons

```css
.btn { min-height: 48px; padding: 0 1.15rem; border-radius: 12px; font-weight: 700; cursor: pointer; }
.btn-primary { background: #0B1F3A; color: #fff; }
.btn-gold { background: #C9A84C; color: #0B1F3A; }
.btn-ghost { background: #fff; color: #0B1F3A; border: 2px solid #0B1F3A; }
```

Pas de `translateY` au hover (évite les layout shifts). Hover = légère opacité ou navy-2.

### Cards / Inputs

Bordure 1px `#D7DEE8`, fond blanc, focus outline 3px or. Inputs `min-height: 48px`, `font-size: 17px`.

### Navigation produit

4 onglets bas uniquement : Accueil · Agenda · Messages · Plus.  
Le reste (bot, devis, rappels, abonnement) = gros boutons dans Plus.

### Langue

Toggle **FR | WO**. Jamais les deux langues dans le même libellé de bouton.

---

## Style Guidelines

**Style (skill) :** Minimalism & Swiss Style  
**Keywords :** Clean, spacious, functional, high contrast, geometric, sans-serif, essential  
**Best For :** SaaS B2B, outils professionnels, dashboards simples

### Page Pattern (skill) : Product Demo + Features

Section order landing :

1. Hero (promesse + 2 CTA)
2. Mockup / simulateur WhatsApp (pas de vidéo autoplay)
3. 6 cartes fonctionnalités
4. 3 formules 1 500 / 3 000 / 6 000 F
5. Comptes démo + CTA

---

## Motion

Motion 2/10. Pas de GSAP obligatoire. Si hover : 150ms opacity.  
Toujours `prefers-reduced-motion: reduce` → aucune animation.

---

## Anti-Patterns (Do NOT Use)

- IA purple / rose / cyan (`#7C3AED`, glassmorphism, dark mode)
- Robot 3D, cerveau, circuits, mascotte animal
- Clichés Afrique : baobab, lion, masque, kente, carte du continent
- Emojis comme icônes (SVG stroke 1.8px navy)
- Menus complexes, carousel, cookie wall
- Ombres, gradients, animations lourdes
- WhatsApp vert comme couleur de marque

---

## Pre-Delivery Checklist

- [ ] Nom **Assistant Bi**
- [ ] HEX navy / or / blanc uniquement
- [ ] Pas d’emoji-icône, `cursor-pointer` partout
- [ ] Contraste texte ≥ 4.5:1
- [ ] Focus visible (or)
- [ ] `prefers-reduced-motion`
- [ ] Responsive 375 / 768 / 1024 / 1440
- [ ] Boutons ≥ 48px, pas de scroll horizontal mobile
