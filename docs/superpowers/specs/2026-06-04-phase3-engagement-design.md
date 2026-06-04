# Phase 3 — Engagement (CodeMirror editor + solution diff) — Design

**Date:** 2026-06-04
**Status:** Approved

## Goal
Two engagement upgrades to the practice experience, both fully client-side / free:
1. A real **syntax-highlighted code editor** (CodeMirror 6) in place of the plain textarea.
2. **Compare-your-solution** — after a pass, a highlighted line-diff between the learner's
   submitted code and the model solution, so they can see a cleaner/idiomatic approach.

## Non-Goals (deferred)
- AI solution review (needs an API call — not free/static).
- XP / levels / badges; multiple study modes (MCQ/flashcard). Future phases.

## Feature A — CodeMirror editor
- Rewrite `src/lib/components/CodeEditor.svelte` to use CodeMirror 6:
  - Extensions: `python()` language, line numbers, bracket matching, history, default +
    `indentWithTab` keymaps, a dark theme matching the current editor (near-black surface,
    light text), and an `EditorView.updateListener` that pushes document changes out.
  - **Interface unchanged:** still `let { value = $bindable('') } = $props();` so
    `Practice.svelte` is untouched.
  - **External-change sync:** when `value` is set from outside (navigating exercises resets
    `code` to the next `starterCode`), the editor must reflect it. Use a `$effect` that, when
    `value` differs from the editor's current document, dispatches a transaction replacing
    the doc. Guard against feedback loops (don't re-emit when applying an external set).
- Deps: `codemirror`, `@codemirror/lang-python`.

## Feature B — Solution diff
- `src/lib/diff/lineDiff.js`: pure `lineDiff(userCode, solution)` wrapping `diff`'s
  `diffLines`, returning an array of `{ type: 'add' | 'del' | 'same', text }` per line
  (split multi-line hunks into individual lines; drop a trailing empty line). Unit-tested.
- `src/lib/components/SolutionDiff.svelte`: props `{ userCode, solution }`; renders the
  `lineDiff` rows — `add` rows on `--color-pale-green`, `del` rows on a soft-coral tint,
  `same` plain — monospace, with a small legend. Two labeled sub-headers ("YOUR CODE" diff
  against "MODEL SOLUTION") via a caption.
- `Practice.svelte` integration:
  - Capture the exact code that was run when a pass occurs (`submittedCode = code`).
  - In the passed-result area, add a "Compare with model solution" toggle that renders
    `<SolutionDiff userCode={submittedCode} solution={current.solution} />`.
  - Reset the compare state on navigation.
- Dep: `diff`.

## Data flow
Editor (CodeMirror) ⇄ `code` (bindable) → Run → Pyodide → pass → `submittedCode` captured →
Compare toggle → `lineDiff(submittedCode, current.solution)` → `SolutionDiff` rows.

## Error handling
- CodeMirror mount failure must not break the page; the run pipeline still reads `value`.
- `lineDiff` handles empty inputs (returns all-`del`/all-`add`/empty sensibly).

## Testing
- Unit: `lineDiff` (add/del/same classification, multi-line hunks, empty inputs).
- Build passes with the new deps.
- Browser smoke test updated to type into CodeMirror's contenteditable (`.cm-content`),
  run, pass, then toggle Compare and assert diff rows render.

## Files
- Rewrite: `src/lib/components/CodeEditor.svelte`
- Create: `src/lib/diff/lineDiff.js` (+ test), `src/lib/components/SolutionDiff.svelte`
- Modify: `src/lib/views/Practice.svelte`, `package.json`
