# Gardener Journal

---

## 2026-06-07T05:08Z

**Focus:** Content — add 2 exercises to ch24 (thinnest chapter, 3 questions)

**Chosen because:** Content last landed 4 runs ago (00:00Z); ch24 was the thinnest chapter (3 questions); backlog identified batch prediction and model versioning as uncovered topics.

**Changes:**
- Added `ch24-batch-predict-04`: batch prediction loop — build feature matrix from list of dicts, apply `X @ weights + bias` (medium)
- Added `ch24-model-metadata-05`: model versioning — create metadata dict with required keys, return sorted key list (easy)
- Updated `public/bank/meta.json`: `generatedAt` → `2026-06-07`

**Test+build:** 19 files / 70 tests passed; `Bank valid: 162 questions across chapters 1-24`; build succeeded (benign 626KB chunk warning)

**Browser smoke:** browser unavailable (Chromium apt deps blocked in env)

**Outcome:** Content-only change — bank validator passed — auto-merged (see PR)

**New backlog ideas added:** see BACKLOG.md

---

## 2026-06-07T04:10Z

**Focus:** Bug fix — guard `run()` against concurrent Ctrl+Enter calls

**Chosen because:** Highest-priority actionable bug in backlog: the Ctrl+Enter keyboard shortcut (added in run 03:08Z) bypasses the `disabled={running}` guard on the Run button, allowing rapid keystrokes to queue multiple concurrent async pyodide/SQL calls. The button UI correctly disables, but the keymap path did not.

**Changes:**
- `src/lib/views/Practice.svelte`: added `if (running) return;` at top of `run()` (line 80)
- `src/lib/views/Learn.svelte`: added `if (running) return;` at top of `run()` (line 55)
- `src/lib/views/Sql.svelte`: added `if (running) return;` at top of `run()` (line 59)

The guard makes each `run()` function idempotent: the first in-flight call holds the lock; any subsequent call (from keyboard shortcut or button double-click) is a no-op until `finally` releases it.

**Test+build:** 19 files / 70 tests passed; build succeeded (benign 626KB chunk warning)

**Browser smoke:** browser unavailable (Playwright installed but Chromium apt deps failed in env)

**Outcome:** App-code change — both npm test and npm run build passed — auto-merged (see PR)

**New backlog ideas added:** see BACKLOG.md

---

## 2026-06-07T00:00Z

**Focus:** Content — add 2 exercises to thinnest chapters (ch13 and ch15, each had only 3 questions)

**Changes:**
- Added `ch13-kernel-rbf-04`: RBF/Gaussian kernel evaluation (medium) — K(x,z)=exp(-γ‖x-z‖²) with numpy
- Added `ch15-gini-impurity-04`: Gini impurity (easy) — G=1-Σpᵢ² using np.unique

**Test+build:** 19 files / 70 tests passed; build succeeded; `Bank valid: 160 questions across chapters 1-24`

**Browser smoke:** browser unavailable (Playwright installed but Chromium deps failed in apt)

**Outcome:** Content-only change — auto-merged (see PR)

**New backlog ideas added:** see BACKLOG.md

---

## 2026-06-07T01:08Z

**Focus:** Mobile — header tab nav usability on small screens

**Changes:**
- `src/lib/components/Header.svelte`: added `@media (max-width: 640px)` block:
  - `.bar` wraps (flex-wrap), height auto, compact padding
  - `nav` moves to its own row (order:3, full width), `overflow-x: auto` with `-webkit-overflow-scrolling: touch`, scrollbar hidden
  - nav buttons get `min-height: 44px` (touch-friendly tap targets) and `white-space: nowrap`
  - `.version` span ("v0.1") hidden on mobile (cosmetic, saves space)

**Test+build:** 19 files / 70 tests passed; build succeeded (benign 626KB chunk warning); Bank valid: 160 questions

**Browser smoke:** browser unavailable (Playwright installed, Chromium apt deps failed)

**Outcome:** App-code change — both npm test and npm run build passed — auto-merged (see PR)

**New backlog ideas added:** Practice/SQL mobile overflow audit; sticky bottom nav consideration; persist active tab in localStorage

---

## 2026-06-07T02:06Z

**Focus:** Mobile UX — fix CodeMirror editor font-size to prevent iOS Safari auto-zoom

**Changes:**
- `src/lib/components/CodeEditor.svelte`: changed `fontSize: '14px'` → `fontSize: '16px'` in the CodeMirror hostTheme. iOS Safari auto-zooms any input/interactive element with font-size < 16px; this prevents that jarring UX on the Practice, Learn, SQL, and Library tabs.

**Test+build:** 19 files / 70 tests passed; build succeeded (benign 626KB chunk warning); Bank valid: 160 questions

**Browser smoke:** browser unavailable (Chromium apt deps blocked in env)

**Outcome:** App-code change — both npm test and npm run build passed — auto-merged (see PR)

**New backlog ideas added:** see BACKLOG.md

---

## 2026-06-07T03:08Z

**Focus:** UX — Ctrl+Enter / Cmd+Enter keyboard shortcut to run code

**Changes:**
- `src/lib/components/CodeEditor.svelte`: added `onRun = null` prop; added `{ key: 'Mod-Enter', run: () => { if (onRun) { onRun(); return true; } return false; } }` to the CodeMirror keymap alongside `indentWithTab`. `Mod-Enter` resolves to Ctrl+Enter on Windows/Linux and Cmd+Enter on Mac.
- `src/lib/views/Practice.svelte`: changed `<CodeEditor bind:value={code} />` → `<CodeEditor bind:value={code} onRun={run} />`
- `src/lib/views/Learn.svelte`: changed `<CodeEditor bind:value={code} />` → `<CodeEditor bind:value={code} onRun={run} />`
- `src/lib/views/Sql.svelte`: changed `<CodeEditor bind:value={query} lang="sql" />` → `<CodeEditor bind:value={query} lang="sql" onRun={run} />`

**Test+build:** 19 files / 70 tests passed; build succeeded (benign 626KB chunk warning); Bank valid: 160 questions

**Browser smoke:** browser unavailable (Chromium apt deps blocked in env)

**Outcome:** App-code change — both npm test and npm run build passed — auto-merged (see PR)
