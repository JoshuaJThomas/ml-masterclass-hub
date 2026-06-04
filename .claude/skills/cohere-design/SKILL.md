---
name: cohere-design
description: Use before writing or editing ANY UI in this project — applies the Cohere design system (tokens, type, components) and its restraint rules so every screen, including night-agent-generated UI, stays visually consistent.
---

# Cohere Design System (project UI rules)

Before writing or changing any UI, read `DESIGN.md` at the project root — it is the full
spec (colors, typography, radii, spacing, components, do's and don'ts).

## Hard rules
- Tokens come from `src/lib/design/tokens.js` → CSS variables (`--color-*`, `--radius-*`,
  `--space-*`, `--font-*`). Never hardcode hex/px that a token already covers.
- Default surface is canvas white (`--color-canvas`). Use deep green (`--color-deep-green`)
  or dark navy (`--color-dark-navy`) only as full-width emphasis bands.
- Primary action = near-black pill (`.btn-primary`). Secondary = underlined text link.
- Card radii are 8px (`--radius-sm`) or 22px (`--radius-lg`). No card radius below 8px.
- Depth is flat: thin hairline borders, NOT drop shadows.
- Type split: display = `--font-display`, body/UI = `--font-body`, technical labels =
  `--font-mono` (uppercase mono labels).

## Gamification adaptation (this project)
Streaks, XP, mastery and heatmaps must stay calm and "research-lab", not cartoonish:
- Use mono labels, hairline rules, and `--color-deep-green` / `--color-pale-green`
  accents. Coral (`--color-coral`) is for small editorial chips only.
- Never turn coral/blue into broad decorative fills. No heavy shadows or loud badges.

## Don'ts
- No saturated gradient UI backgrounds (gradients are media-led only).
- Don't replace the display/body/mono split with one generic sans.
- Don't box every section; Cohere uses open space, rules, and unframed rows too.
