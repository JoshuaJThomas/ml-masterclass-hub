# Wave 1 — Playful, mobile-first redesign + a workspace that teaches

- **Date:** 2026-06-08
- **Status:** approved (direction), building Phase 1a
- **Branch:** `wave1-playful-redesign`

## Why (user feedback, condensed)
The app reads like an early-2000s learning website, not a mobile app. On the user's
phone (Oppo Find X9) content overflows sideways — they have to scroll left/right. The
code workspace feels "1-dimensional": the only feedback is a single hidden
`assert result == X`; on failure you get a bare "✗ Not yet" with no sign of what your
code produced or how it differed, no way to just *run* code without being graded, and
revealing a hint/solution silently marks you failed. Net effect: frustration, no room
to learn your own way, no reason to come back daily. (Math-flavored content is a real
dislike too — handled in Wave 3.)

## Design language — "Cohere-refined, but playful and alive"
The app already uses Cohere's palette (`tokens.js`); the problem was flat *execution*,
not colour. Keep the refined Cohere base, layer gamification on top, spend the effort
on **depth + motion + app navigation**.

- **Palette:** keep Cohere coral/stone/ink as the refined base; add gamification accents
  — XP **gold**, streak **flame-orange**, "win" **lime/green**, plus soft tinted surfaces
  for cards/sections. Accent is a one-line token change → easy to retune after it's live.
- **Depth:** layered/elevation shadows, subtle gradients, a lightly frosted bottom bar.
  Cards are surfaces, not bordered boxes.
- **Motion (the anti-"1D"):** Svelte 5 native — `transition` (entrance fly/scale),
  `motion/spring` (button press, XP/streak count-ups), `animate/flip` (list reflow),
  **View Transitions API** for tab switches (progressive enhancement; instant fallback).
  Hand-rolled canvas **confetti** on a win. No new runtime dependency.
- **App chrome, not web chrome:** bottom tab bar; no footer; real buttons/chips instead
  of underlined text links; **system font** (fast + offline).

## Phase 1a — Reskin + mobile fix + bottom tabs  (ship first; pure look/layout, low risk)
Files & changes:
- `src/lib/design/tokens.js` — extend with gamification accents (gold/flame/lime),
  elevation shadow tokens, surface tints, spring/timing tokens. Keep existing Cohere colours.
- `src/lib/design/global.css` — **responsive type scale** via `clamp()` (kills the 96px
  hero on phones), **`overflow-x` guard** on html/body, refined `.btn-primary` (pill +
  hover-lift + active-press via spring/transform), `.btn-chip`, card elevation, drop
  webpage chrome.
- **`src/lib/components/BottomTabBar.svelte` (new)** — 5 tabs: 🎯 Practice · 📚 Learn ·
  🗃 SQL · 📖 Library · 📊 Progress. Icon + label, active highlight, fixed bottom,
  `env(safe-area-inset-bottom)` padding, lightly frosted/elevated.
- `src/lib/components/Header.svelte` — slim it to a compact **context bar**: streak 🔥 +
  XP ⭐ (and small title). Remove the 5-button nav (now bottom tabs). Responsive, no overflow.
- `src/App.svelte` — app shell: scrollable `main` + bottom tab bar; switch views via tabs;
  View Transition on switch; remove footer; entrance transition on view content.
- Wire streak/XP into the header context bar from existing `stats/gamification` + `srs/activity`.

**Acceptance (1a):** no horizontal scroll at 360–412px width; all tabs thumb-reachable;
reads as an app (no footer, no underlined-link buttons); `npm test` + `npm run build` pass.

## Phase 1b — Workspace that teaches  (the core fix; more logic)
- `src/lib/runner/pyodideRunner.js`
  - **Just-run mode:** run user code, capture stdout + `repr(result)` if defined, **no grading**.
  - **Graded fail returns the user's value:** capture `repr(result)` so the UI can show
    "you got X".
  - **Expected value:** add an `expected` (repr string) to each exercise in the bank,
    **auto-derived at validate time** (the validators already execute each solution — capture
    its `result`). Exercises that don't follow the `result = …` convention (functions /
    multi-assert) fall back to a friendly message + the user's stdout (no expected/got diff).
- `src/lib/views/Practice.svelte` & `Learn.svelte`
  - "Run" always shows output; add a **"Try it"** (no-grade) button.
  - **Friendly result card:** "So close 👀 — you got `X`, expected `Y`" + a one-line nudge,
    instead of a bare `AssertionError`.
  - **Curiosity un-punished:** revealing a hint/solution no longer auto-fails the card
    (may still factor into SRS rating, but is not a terminal fail).
  - **Win moment:** confetti + XP/streak pop on pass. Friendlier copy throughout.

**Acceptance (1b):** failing a `result`-style exercise shows your value vs expected;
"Try it" runs without grading; revealing solution doesn't mark fail; passing celebrates;
`npm test` + `npm run build` pass.

## Out of scope (later waves)
- **Wave 2:** offline/PWA — service worker, manifest, cache Pyodide so it works on the train.
- **Wave 3:** re-flavor content toward data/ML (pandas/datasets/"analyze & predict"),
  retire pure-math exercises. Night-gardener + three-brain do the bulk.

## Build & token strategy
- Phase 1a's design-defining files (tokens, global.css, tab bar, shell) are written
  directly for quality — that's the centerpiece the user judges. Bulkier/repetitive work
  (Wave 3 content, tests, rote components) is delegated to Haiku/Gemini workers and the
  night-gardener.
- **Merge gate (matches the gardener's rule):** any app/UI change merges only if
  `npm test` **and** `npm run build` pass. Work on `wave1-playful-redesign`; deploy to the
  live site (push/merge to `main`) only with the user's go-ahead, since that's public + live.

## Risks
- Expected-value derivation for non-`result` exercises → mitigated by friendly fallback.
- View Transitions API support varies → progressive enhancement, instant fallback.
- CodeMirror's `oneDark` theme vs the new palette → may retheme the editor in 1b.
