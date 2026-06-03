# ML Masterclass Spaced-Repetition Practice Web App — Design

**Date:** 2026-06-03
**Owner:** lmaonade992@gmail.com
**Status:** Draft for review

## Problem & Context

The user is taking Jose Portilla's Python/ML Udemy course. The course materials live in
a Google Drive `Udemy` folder containing chapters 0–23, each with several Jupyter
notebooks. The user is currently on **chapter 8** and wants to keep older chapters
(0–8) fresh so they don't forget them.

They want a **visually nice web app, accessible from any device** (phone, laptop,
computer), that serves a **different set of coding practice exercises each day**, drawn
across the chapters they've already completed (spaced repetition). It should be linked to
their GitHub and grow as they progress through new chapters.

## Goals

- A web app, hosted free and reachable from any device via a URL.
- Each day presents a **different** spaced-repetition set of **coding exercises**
  (problem + hint + worked solution) across completed chapters.
- The same daily set appears on every device that day (no login/backend needed).
- Easy to grow: when the user finishes a new chapter, its exercises are added and the
  site updates itself.
- Makes use of the user's existing Claude plan for the (occasional) generation work.

## Non-Goals (for now — YAGNI)

- No morning email digest, file upkeep, or other automations from earlier brainstorming.
- No auto-grading of the user's submitted code.
- No cross-device progress sync / accounts (daily set is consistent across devices, but
  personal streak/"done" state is per-device only).
- No nightly auto-regeneration in v1 (daily freshness comes from *selection*, not
  generation). This is a documented future phase.

## Source of Truth

- Google Drive `Udemy` folder, chapters `0`–`23`, each with multiple `.ipynb` files.
- Only chapters **0 through `completedThrough`** (currently 8) are in scope at any time.
- Claude reads notebooks from Drive **interactively** (during a session), so there is no
  headless-auth problem. The user raises `completedThrough` when they finish a chapter,
  and Claude reads just the new chapter(s) to extend the bank.

## Architecture

Three phases. v1 = Phases 1 + 2. Phase 3 is future/optional.

### Phase 1 — Question Bank Generation (occasional, per new chapter)

- Claude reads the in-scope chapter notebooks from Drive.
- For each chapter, generates a set of **coding exercises**. Each exercise:
  - `id` — stable unique id, e.g. `ch03-pandas-groupby-01`
  - `chapter` — integer
  - `topic` — short label
  - `prompt` — the task to write code for
  - `hint` — one nudge
  - `solution` — worked code solution (revealed on demand)
  - `difficulty` — `easy` | `medium` | `hard`
- Output: a single `questions.json` committed to the repo:

  ```json
  {
    "completedThrough": 8,
    "generatedAt": "2026-06-03",
    "questions": [
      {
        "id": "ch03-pandas-groupby-01",
        "chapter": 3,
        "topic": "pandas groupby",
        "prompt": "Given a DataFrame `df` with columns 'team' and 'points', return the average points per team.",
        "hint": "groupby + an aggregation.",
        "solution": "df.groupby('team')['points'].mean()",
        "difficulty": "easy"
      }
    ]
  }
  ```

- Adding a chapter = read that chapter, append its exercises, bump `completedThrough`,
  commit. Existing ids are never reused or renumbered.

### Phase 2 — The Website (used daily)

- **Static site** (vanilla HTML/CSS/JS, no build step) in the same repo, served by
  **GitHub Pages**.
- On load it fetches `questions.json` and selects the **day's set**:
  - **Pool:** all questions with `chapter <= completedThrough`.
  - **Daily selection:** deterministic, seeded by the current date (so all devices match
    that day). A seeded PRNG picks `N` questions (default **5**).
  - **Spaced-repetition weighting:** selection favors **older chapters** (further below
    the current chapter) so chapters 1–3 resurface as often as recent ones, rather than
    the newest chapter dominating. Concretely: weight each question by how "due" its
    chapter is, then sample without replacement using the date seed. Aim for a spread
    across chapters within each day's set (avoid 5 from one chapter).
- **UI per exercise:** the prompt, a "Show hint" toggle, and a "Reveal solution" toggle
  (solution hidden by default so it's real practice). Clean, mobile-friendly layout.
- **Per-device progress (localStorage only):** mark each exercise "got it / review",
  show a simple daily-completion + streak indicator. This is local to the device and does
  **not** affect the (date-deterministic) selection, preserving cross-device consistency.

### Phase 3 — Overnight Bank Expansion (future, optional)

- A scheduled Claude job that periodically generates *additional* / harder variants for
  existing chapters and commits them, so the bank deepens over time. Uses the user's plan
  capacity. Deferred until Phases 1–2 are proven.

## Data Flow

```
Drive (Udemy notebooks, ch 0–8)
        │  (Claude reads, interactively)
        ▼
   questions.json  ──commit──▶  GitHub repo ──▶ GitHub Pages (static site)
                                                      │
                                          fetch questions.json
                                                      ▼
                                   date-seeded spaced-repetition selection
                                                      ▼
                                     today's exercises on phone/laptop/PC
```

## Components & Interfaces

- `questions.json` — the bank + `completedThrough`. The single contract between
  generation and the website.
- `index.html` / `style.css` / `app.js` — the static site. `app.js` owns: fetch bank →
  seeded daily selection + weighting → render → localStorage progress.
- Generation is a documented Claude procedure (read chapter N notebooks → append
  exercises → bump `completedThrough` → commit), not application code.

## Error Handling

- Missing/empty `questions.json` → site shows a friendly "no questions yet" state.
- Fewer questions in pool than `N` → show all available, no crash.
- Malformed entries are skipped, not fatal.
- localStorage unavailable (private mode) → progress silently disabled, practice still
  works.

## Testing

- A small fixture `questions.json` to verify: date-seeded selection is stable for a given
  date, varies across dates, spreads across chapters, and respects `completedThrough`.
- Manual check on phone + laptop that the same date yields the same set.
- Verify reveal/hint toggles and the empty/too-few-questions edge cases.

## Dependencies

- User's GitHub account (confirmed) — one new repo, GitHub Pages enabled.
- Google Drive access to the `Udemy` folder (confirmed) — read-only, for generation.

## Open Questions

- Exact value of `N` per day (default assumed **5**; light **3** is an option).
- Visual style preference (theme/colors) — can be decided at build time.
