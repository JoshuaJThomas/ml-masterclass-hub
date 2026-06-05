# Learn+Practice Track — Design

**Date:** 2026-06-05
**Status:** Approved

## Goal
A "Learn" tab that teaches each concept then has you apply it — like learnpython.org.
Left = a markdown lesson (explanation + worked examples); right = a lesson-specific
practice exercise with the existing run/check. Completing the apply feeds the same FSRS
memory + streak. The lesson list doubles as a browseable syllabus.

## Decisions
- Lessons cover **all completed chapters 1–8** (~30+ lessons), ordered.
- Each lesson has its **own tailored apply exercise** (not reused from the bank).
- New **Learn tab** (nav: Learn · Practice · SQL · Progress).

## Data (`public/bank/lessons.json`)
Array, ordered. Each lesson is an exercise + teaching:
```
{ id: "lesson-ch01-01", chapter: 1, order: 1, topic, title,
  content: "<markdown>",          // taught material, left pane
  starterCode, check, hint, solution, difficulty }   // apply, right pane
```
`id` prefix `lesson-ch<NN>-<NN>`. The apply exercise is self-contained and runs on
numpy/pandas/matplotlib only (same constraints as the bank). The `id` is also the FSRS
card id (shared `progress` store; `lesson-` prefix never collides with `ch-`/`sql-`).

## UI
- `view` store → `'learn' | 'practice' | 'sql' | 'progress'`; Header gains a **Learn** tab
  (placed first).
- `src/lib/views/Learn.svelte`: a lesson list (grouped by chapter, ✓ when its card is
  seen/known) + the selected lesson as a **split**: rendered markdown (left) and the
  `CodeEditor` + Run + result + hint/reveal-solution (right). Prev/Next moves through the
  ordered list. Passing the apply grades the FSRS card (via `scheduler`/`progress`/
  `activity`) and ticks the lesson.
- `src/lib/components/Markdown.svelte`: renders lesson markdown via `marked` (our own
  trusted content), styled with tokens (headings, inline code, code blocks monospace).

## Reuse
Pyodide runner, `CodeEditor`, FSRS grading (`newCard`/`grade`/`ratingFor`/`recordReview`/
`logReview`), and the result panel pattern — all already built.

## Content generation
Three-brain: Gemini (`agy`) drafts ~30+ lessons (teaching markdown + apply exercise) in the
schema; a build step runs **every apply `solution` against its `check` in Python** and keeps
only verified lessons; Claude reviews teaching quality and merges. Same rigor as the bank.

## Validation & testing
- `scripts/validate-lessons.js` (+ test) checks schema (id prefix, ordered, non-empty
  `content`/`title`, valid apply fields) and is wired into `npm test`.
- Python verifier: every apply solution must satisfy its check.
- Unit: `loadLessons` (mocked fetch); a small `Markdown` render check.
- Browser smoke test: open Learn, read a lesson, solve its apply, confirm it marks complete.

## Files
- Create: `public/bank/lessons.json`; `scripts/validate-lessons.js` (+ test);
  `scripts/gen_lessons.py` (verify helper); `src/lib/lessons/loadLessons.js` (+ test);
  `src/lib/components/Markdown.svelte`; `src/lib/views/Learn.svelte`.
- Modify: `src/lib/components/Header.svelte`, `src/App.svelte`, `package.json` (marked).

## Non-goals (later)
Per-lesson rich progress on the dashboard; lesson search; the night agent generating
lessons (can be added to the gardener later).
