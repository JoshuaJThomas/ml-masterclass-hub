# ML Masterclass Learning Hub — Design Spec

**Date:** 2026-06-03
**Owner:** lmaonade992@gmail.com
**Status:** Draft for review

## Problem & Context

The user is taking Jose Portilla's Python/ML Udemy course. Materials live in a Google
Drive `Udemy` folder (chapters 0–23, each with several Jupyter notebooks). The user is
currently on **chapter 8** and wants to keep earlier chapters (0–8) fresh so they don't
forget them, and wants one **personal learning hub** — accessible on phone/laptop/PC —
that is their home base for practicing and tracking progress.

## Vision

A free, static, install-nothing web app that:
- Lets the user **write and run real Python in the browser** (numpy/pandas/matplotlib)
  against auto-checked exercises generated from their own course notebooks.
- Uses a real **spaced-repetition memory engine** so the right exercises resurface at the
  right time across all completed chapters.
- Shows a **progress dashboard** (per-chapter mastery, streak, heatmap, due counts) — the
  "hub" feeling.
- Looks premium and calm, styled with the **Cohere DESIGN.md** system.
- Grows itself nightly via a **content-gardener agent** that adds exercises.

## Scope

**v1 (build before launch) = Phase 1 + Phase 2:**
- Interactive run-your-code daily practice (Phase 1)
- Spaced-repetition memory engine + progress dashboard (Phase 2)

**Deferred (post-launch):**
- **Phase 3 — Engagement:** multiple study modes (MCQ / flashcard / quiz), difficulty
  tiers & rank progression, "compare your solution," AI solution review, extra polish.
- **Phase 4 — Auto-growing:** the nightly 1am content-gardener agent (decision below) +
  optional cross-device sync.

## Decisions (locked)

- **Sequencing:** bigger v1 (Phases 1+2) before launch.
- **Night agent boundary:** *content gardener, auto-publish* — it may only add/refresh
  exercises and write a changelog; those auto-publish. No structural/feature/redesign
  changes without a supervised session. (Built in Phase 4.)
- **Daily exercise volume:** 5 (used as the daily new-card limit; due reviews are on top).
- **Progress storage:** per-device (localStorage) for v1; cross-device sync deferred.
- **Design system:** Cohere `DESIGN.md`, also packaged as a reusable skill (below).
- **Source access:** Claude reads notebooks from Google Drive interactively.

## Source of Truth

- Google Drive `Udemy` folder, chapters `0`–`23`, each with multiple `.ipynb` files.
- Only chapters `0`–`completedThrough` (currently 8) are in scope. User raises
  `completedThrough` on finishing a chapter; Claude reads the new chapter(s) and appends.

## Competitive Building Blocks (what we're adapting)

In-browser run-and-check (DataCamp/Codecademy, via Pyodide) · true SRS scheduling
(Anki/Execute Program, via FSRS) · streaks/XP/daily goal (Duolingo) · progress heatmap
(GitHub) · per-chapter mastery + weak-spot targeting (Khan Academy) · difficulty/rank
progression (Codewars/WaniKani, Phase 3) · multiple study modes (Quizlet, Phase 3) ·
compare-solution + AI review (LeetCode/Exercism, Phase 3) · calm bite-sized "always doing"
feel (Brilliant). All achievable free + static.

## Architecture

### Content: the question bank

- Claude reads in-scope chapter notebooks and generates **coding exercises**, stored as
  `bank/questions.json` committed to the repo. Each exercise:

  ```json
  {
    "id": "ch03-pandas-groupby-01",
    "chapter": 3,
    "topic": "pandas groupby",
    "prompt": "Given DataFrame `df` with columns 'team' and 'points', assign to `result` the average points per team.",
    "starterCode": "import pandas as pd\n# df is provided\nresult = ...",
    "check": "expected output / assertion the runner verifies",
    "hint": "groupby + an aggregation.",
    "solution": "result = df.groupby('team')['points'].mean()",
    "difficulty": "easy"
  }
  ```

- `bank/meta.json` holds `completedThrough` and `generatedAt`. Existing ids are never
  reused or renumbered, so progress history stays valid as the bank grows.

### Runtime: in-browser Python (Pyodide)

- **Pyodide** (WebAssembly Python with numpy/pandas/matplotlib) loaded from CDN runs the
  user's code entirely client-side — no backend, no cost.
- An exercise provides `starterCode`; the user edits in an embedded code editor
  (CodeMirror), runs it, and the runner evaluates `check` (assertion/expected output) to
  pass/fail. Output and errors are shown inline.

### Memory engine: spaced repetition (FSRS)

- Each exercise the user has seen has an SRS card state (stored per-device in
  localStorage), scheduled with **FSRS** (`ts-fsrs`).
- **Grading is automatic from execution:** pass on first run → "Good"; pass after hint or
  retries → "Hard"; reveal solution / give up → "Again". Manual override allowed.
- **Today's set** = cards *due* today + up to 5 *new* cards drawn from completed chapters,
  weighted toward older/weaker chapters (Khan-style targeting).
- Note: with real SRS the daily set is *personalized and per-device* (Anki model), so it
  is no longer identical across devices. Cross-device parity returns only if/when sync is
  added (Phase 4). This is an accepted trade for a real memory engine.

### Dashboard (the hub)

- Per-chapter **mastery bars** (share of that chapter's cards in "review/known" state).
- **Streak** + daily-goal ring; **GitHub-style heatmap** of days practiced.
- **Due today / new today / total** counts; quick "Start today's practice" entry point.
- All derived from localStorage SRS state + the bank.

### Hosting & stack

- **Static site** built with **Vite + Svelte** (light, low-boilerplate, good for a small
  reactive app with a dashboard), exported static and deployed to **GitHub Pages** via a
  GitHub Actions workflow on push. Pyodide + fonts via CDN. Fully free, no server.
- *(Framework is a recommendation; can be revisited at plan time. Pyodide + static
  GitHub Pages hosting are fixed.)*

### Design system + skill

- Styling strictly follows the project `DESIGN.md` (Cohere): canvas white default,
  deep-green/navy bands for emphasis, near-black pill primary CTAs, 8/22px card radii,
  Unica77/CohereText/CohereMono type split (with documented web-safe fallbacks since the
  proprietary fonts aren't bundled), flat depth, restrained accents.
- **Gamification adapted to Cohere's restraint:** streaks/XP/mastery rendered with mono
  labels, hairline rules, deep-green accents and pale-green/coral chips — a calm "research
  lab" aesthetic, *not* loud game chrome (DESIGN.md forbids broad decorative accent fills
  and heavy shadows).
- **Packaged as a skill:** a reusable skill that points the agent (and the night agent) at
  `DESIGN.md` and the adaptation rules, so all current and future UI stays consistent.
  Authored via the writing-skills process during implementation.

## Data Flow

```
Drive (Udemy notebooks, ch 0–8)
        │  Claude reads (interactive) → generates exercises
        ▼
   bank/questions.json + bank/meta.json ──commit──▶ GitHub repo
        │                                              │ GitHub Actions build
        ▼                                              ▼
   (Phase 4: nightly content-gardener appends)   GitHub Pages static site
                                                       │
                              fetch bank → FSRS picks due+new → run code (Pyodide)
                              → auto-grade → reschedule → update dashboard
                                                       ▼
                                   today's practice + progress on any device
```

## Components & Interfaces

- `bank/questions.json` + `bank/meta.json` — the content contract between generation and
  the app. Stable ids.
- `DESIGN.md` — the styling contract; enforced via the design skill.
- App modules (Svelte): **bank loader**, **SRS scheduler** (ts-fsrs wrapper +
  localStorage), **Pyodide code runner** (load + execute + check), **exercise view**
  (editor, run, hint, reveal), **dashboard** (mastery/streak/heatmap), **settings**
  (`completedThrough`, daily new-card limit, reset progress).
- Generation procedure — documented Claude steps (read chapter N → append exercises → bump
  `completedThrough` → commit), reused by the Phase-4 night agent.

## Error Handling

- Missing/empty bank → friendly "no exercises yet" state.
- Pyodide load failure / offline → clear message, retry; exercises still readable.
- Fewer due+new than target → show what's available, no crash.
- Malformed exercise entries skipped, not fatal.
- localStorage unavailable (private mode) → progress disabled gracefully; practice works.
- User code errors/timeouts in Pyodide → caught and shown as failed run, never crash app.

## Testing

- Fixture bank to verify: FSRS scheduling (due/new selection, grade → next interval),
  weak-chapter weighting of new cards, `completedThrough` gating.
- Pyodide runner: a passing solution grades pass, a wrong one grades fail, an erroring one
  is caught.
- Dashboard math: mastery %, streak rollover, heatmap counts from known SRS state.
- Manual: phone + laptop load, run code, edge cases (empty bank, private mode).

## Dependencies

- GitHub account (confirmed) — one repo + Pages enabled + Actions deploy.
- Google Drive access to `Udemy` (confirmed) — read-only, for generation.
- CDNs: Pyodide, fonts. (Acceptable external deps; site degrades gracefully.)

## Open Questions

- Final framework (Vite+Svelte recommended; Pyodide + static Pages fixed regardless).
- Web-safe font fallbacks to approximate Unica77/CohereText/CohereMono (e.g. Inter + Space
  Grotesk + a mono) — chosen at build time.
- Daily-goal target and streak rules (e.g. "complete N exercises" counts as a day).
