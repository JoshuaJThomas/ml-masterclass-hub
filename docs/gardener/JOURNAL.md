# Gardener Journal

---

## 2026-06-08T02:08Z

**Focus:** PWA — minimal Workbox-free service worker for offline shell

**Chosen because:** Highest-priority backlog item; direct follow-on to the web manifest that landed last run (2026-06-08T01:09Z). The app was already installable but had no offline capability. The service worker completes the core PWA story.

**Changes:**
- `public/sw.js`: created — stale-while-revalidate strategy. On `install`: pre-caches `['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png']` and calls `skipWaiting()`. On `activate`: evicts all old caches (those not named `ml-hub-v1`) and calls `clients.claim()`. On `fetch`: same-origin GET requests only — returns cached response immediately if present (stale), simultaneously fetches from network and updates cache in background (while-revalidate). Cross-origin requests (Pyodide CDN) are passed through unmodified.
- `index.html`: added inline `<script>` that registers `/sw.js` on `window load` using the standard `'serviceWorker' in navigator` feature-detect guard.

**Test+build:** 19 files / 70 tests passed; Bank valid: 162 questions across chapters 1-24; SQL bank valid: 14 questions; Lessons valid: 32; build succeeded (benign 627KB chunk warning); `dist/sw.js` present in build output.

**Browser smoke:** browser unavailable (Chromium apt deps blocked in env)

**Outcome:** App-code change — both npm test and npm run build passed — auto-merged (see PR below)

**New backlog ideas added:** see BACKLOG.md

---

## 2026-06-08T01:09Z

**Focus:** PWA — add web app manifest for mobile installability

**Chosen because:** Top High Priority backlog item. The manifest is the first, self-contained step toward making the app installable on mobile home screens (service worker is the follow-on). Mobile polish is now well advanced (tab nav, font-size, scroll-into-view, CodeMirror focus); making the app installable is the logical next step.

**Changes:**
- `public/manifest.json`: created — name "ML Masterclass", short_name "ML Hub", display:standalone, background_color:#ffffff, theme_color:#863bff (brand purple from favicon); icons: icon-192.png, icon-512.png (any maskable), and favicon.svg (any).
- `public/icons/icon-192.png`: generated with Python/Pillow — 192×192, brand-purple background (#863bff), white lightning-bolt polygon echoing the favicon shape.
- `public/icons/icon-512.png`: same design at 512×512.
- `index.html`: added `<link rel="manifest" href="/manifest.json">`, `<meta name="theme-color" content="#863bff">`, three Apple-specific meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`), and `<link rel="apple-touch-icon" href="/icons/icon-192.png">` for iOS installability.

**Test+build:** 19 files / 70 tests passed; Bank valid: 162 questions across chapters 1-24; SQL bank valid: 14 questions; Lessons valid: 32; build succeeded (benign 627KB chunk warning)

**Browser smoke:** browser unavailable (Chromium apt deps blocked in env)

**Outcome:** App-code change — both npm test and npm run build passed — auto-merged (see PR below)

**New backlog ideas added:** see BACKLOG.md

---

## 2026-06-07T07:09Z

**Focus:** UX — persist active tab across page reload (localStorage)

**Chosen because:** Top High Priority backlog item. Every page reload resets the view store to `'practice'`, losing the user's position. This is a tiny, zero-risk change that directly improves daily UX.

**Changes:**
- `src/lib/stores/view.js`: replaced `writable('practice')` with a store that (a) reads `localStorage.getItem('mlhub.view.v1')` on init — validating against the 5 known view names, falling back to `'practice'` — and (b) subscribes to its own changes to write back to localStorage. Both read and write are wrapped in try/catch for environments where localStorage is blocked. New localStorage key: `mlhub.view.v1` (doesn't clash with the protected keys `mlhub.progress.v1`, `mlhub.activity.v1`, `mlhub.currentChapter`).

**Test+build:** 19 files / 70 tests passed; build succeeded (benign 627KB chunk warning)

**Browser smoke:** browser unavailable (Chromium apt deps blocked in env)

**Outcome:** App-code change — both npm test and npm run build passed — auto-merged (see PR below)

**New backlog ideas added:** see BACKLOG.md

---

## 2026-06-07T06:09Z

**Focus:** Bug/UX fix — CodeMirror mobile scroll-into-view on focus

**Chosen because:** Highest-priority backlog item (High Priority section). iOS/Android virtual keyboard can obscure the CodeMirror editor when it opens. This is a direct follow-on to the font-size fix (02:06Z) and the mobile tab nav fix (01:08Z), continuing the mobile-polish thread.

**Changes:**
- `src/lib/components/CodeEditor.svelte`:
  - Added `onEditorFocus()` function: calls `host.scrollIntoView({ behavior: 'smooth', block: 'nearest' })` with a 300ms delay (to let the virtual keyboard finish animating before scrolling).
  - In `onMount`: attached `onEditorFocus` as a `focusin` listener on the host div — `focusin` bubbles up from CodeMirror's inner `.cm-content` element.
  - In `onDestroy`: removed the `focusin` listener before destroying the editor view.

**Test+build:** 19 files / 70 tests passed; Bank valid: 162 questions across chapters 1-24; build succeeded (benign 626KB chunk warning)

**Browser smoke:** browser unavailable (Chromium apt deps blocked in env)

**Outcome:** App-code change — both npm test and npm run build passed — auto-merged (see PR)

**New backlog ideas added:** see BACKLOG.md

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
