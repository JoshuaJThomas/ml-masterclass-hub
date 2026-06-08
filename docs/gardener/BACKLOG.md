# Gardener Backlog

Prioritized list of improvements for future runs. Remove items when completed.

---

## High Priority

### PWA: Service worker cache versioning on deploy
The current service worker uses a hardcoded cache name `ml-hub-v1`. When assets change (new build), the service worker needs a new cache name to evict stale content. Consider either: (a) injecting a build timestamp into `sw.js` via a Vite plugin (e.g. vite-plugin-replace) or (b) adding a simple version comment that the gardener bumps when making app-code changes. Without this, users may see stale assets after a deploy.

### UX: Install prompt / "Add to Home Screen" banner
After the manifest lands, trigger the browser's beforeinstallprompt event and show a subtle dismissible banner ("Install ML Hub on your home screen") at the top of the app. Store dismissal in localStorage so it doesn't repeat. Reinforces the PWA investment.

### PWA: Offline fallback page
Add a `public/offline.html` that the service worker serves when navigation fails (no network, no cache). A simple "You're offline — please reconnect to continue practising" message. Tiny file, clean UX.

### CONTENT: Add exercises to ch07 (4 questions) — precision and recall
ch07 covers classification metrics. Not yet covered: precision, recall, F1 score from raw TP/FP/FN/TN counts using numpy (no sklearn). 2 exercises would bring ch07 in line with better-covered chapters.

### UX: Show Ctrl+Enter / Cmd+Enter hint tooltip near the Run button
Now that the keyboard shortcut works, surface it to users: add a `title` attribute to the Run button (e.g. `title="Run (Ctrl+Enter)"`) so hovering shows the hint. Small, reinforces discoverability.

---

## Medium Priority

### CONTENT: Add exercises to ch24 — normalization pipeline (1 remaining)
ch24 now has 5 questions. One backlog topic remains: input normalization pipeline (apply train-fitted mean/std to test data using numpy). This is the last uncovered ch24 topic from the original list.

### CONTENT: ch10 exercises (4 questions — joint-thinnest)
ch10 covers regularization (L1/L2 penalties). Not yet covered: manual L2 penalty gradient (add lambda*w to gradient), L1 sparse-solution check (soft-thresholding). Add 2 new exercises.

### UX: Reset code to starterCode button
Add a small "Reset code" button (or link) below each editor that restores `code` to `current.starterCode`. Useful when a learner has mangled the starter code and wants a clean slate. Small, self-contained — one button + one line in Practice.svelte and Learn.svelte.

### UX: Keyboard navigation between exercises (n/p shortcuts)
Add Alt+N / Alt+P (or similar) to move to the next/previous exercise without reaching for the mouse. Intercept keydown on the page and call nextQuestion/prevQuestion. Helps power users flow through drills quickly.

---

## Low Priority

### UI: Loading/empty states in Progress tab
If localStorage has no data, the Progress tab may show blank or confusing UI. Add a friendly empty-state message and a call-to-action to start practising.

### PERFORMANCE: Code-split CodeMirror bundle
The 626KB JS bundle is dominated by CodeMirror. Use dynamic import() so CodeMirror only loads when the Practice or SQL tab is visited, reducing initial load time.

### A11Y: Keyboard focus indicators
Ensure all interactive elements (tab buttons, run button, hint toggle) have visible `:focus-visible` outlines consistent with the design system.

### MOBILE: Practice/SQL tab — full-width editor layout on narrow screens
On ≤640px the Practice and SQL tabs have the same two-column layout tension as Learn. Verify the editor and question prompt stack cleanly. Adjust padding/margins so nothing overflows.

### MOBILE: Header — consider sticky bottom nav on mobile
For a more app-like feel on mobile, swap the top scrollable nav for a fixed bottom navigation bar with icons (or short labels). Requires icon assets or SVG inline icons.

### MOBILE: Reduce container padding at narrow widths (≤375px)
The Practice and Learn containers use `var(--space-xxl)` (32px) vertical padding and the `.container` class has horizontal padding. At very narrow widths (iPhone SE: 375px) this wastes screen estate. Add a `@media (max-width: 400px)` rule to reduce padding to `var(--space-lg)` (16px) so more content is visible without scrolling.

### A11Y: Add aria-label to CodeMirror editor host
The CodeMirror editor host `<div>` has no accessible label, so screen readers announce only a generic "application" role. Add `aria-label="Python code editor"` (or "SQL code editor" when lang='sql') to the `.editor-host` element so assistive technology announces the editor's purpose.

### PWA: Show update-available toast when service worker finds new content
When the SW finishes updating the cache in the background (stale-while-revalidate), the user is on an old version until they reload. Add a lightweight `controllerchange` listener in the SW registration script: when a new SW takes control, show a small dismissible toast ("Update available — reload to refresh") that calls `window.location.reload()` on click. Requires ~15 lines of JS in the registration block, no new files.

### CONTENT: Add exercises to ch07 — F1 score and ROC-AUC from scratch
ch07 (classification metrics) currently has 4 questions. Not yet covered: F1 score = 2*P*R/(P+R) from raw TP/FP/FN, and trapezoidal ROC-AUC from TPR/FPR arrays using numpy. Both are self-contained (no sklearn). Adding 2 exercises would bring ch07 up to 6 questions, in line with the best-covered chapters.

### MOBILE: Swipe gesture to navigate between exercises
Consider adding touch swipe gestures (left/right) on the Practice and Learn panels to move next/prev exercise. Use Pointer Events API — no library needed. Small `pointerdown`/`pointerup` delta check in Practice.svelte and Learn.svelte.

### UX: Show run-in-progress spinner or visual indicator in editor
When Ctrl+Enter is pressed and run() is already in flight, a user gets no feedback that the keypress was ignored. Consider a subtle pulse/glow on the editor border while `running` is true so it's clear something is happening and no-ops are expected.

### A11Y: Progress tab — announce score update via aria-live
When a new exercise is completed correctly and the score increments, screen readers don't know. Add `aria-live="polite"` to the score display element in the Progress tab so assistive technology announces the updated count immediately after the check passes.

### UX: Persist scroll position on Practice/Learn tabs between tab switches
When switching away from Practice or Learn and back, the scroll position and current question index reset. Could store the exercise index in the view store or a separate ephemeral store so switching tabs doesn't lose your place.

### PWA: Service worker offline shell (follow-on to manifest)
Once the web manifest lands, add a minimal service worker (Cache API, cache-first for the app shell) so the app works offline. Keeps the run focused — manifest first, SW second.

### UX: Chapter-level progress ring in Library tab
The Library tab shows chapters but no visual indication of how many exercises per chapter have been completed. Adding a small SVG progress ring next to each chapter title (calculated from `mlhub.progress.v1`) would give learners a map of where they stand.

---

## Completed

### [DONE 2026-06-08T02:08Z] PWA: Service worker (public/sw.js) — stale-while-revalidate, pre-caches app shell, registered in index.html
### [DONE 2026-06-08T01:09Z] PWA: Web manifest + PNG icons + Apple meta tags — completed (manifest.json, icons/icon-192.png, icons/icon-512.png, index.html)
### [DONE 2026-06-07T07:09Z] UX: Active tab indicator persists across page load — completed (mlhub.view.v1)
### [DONE 2026-06-07T06:09Z] BUG/UX: CodeMirror mobile scroll-into-view on focus — completed (focusin + 300ms delay)
### [DONE 2026-06-07T05:08Z] CONTENT: ch24 batch prediction + model metadata — completed
### [DONE 2026-06-07T04:10Z] BUG: run() concurrent-call guard (if running return) — completed
### [DONE 2026-06-07T03:08Z] UX: Ctrl+Enter / Cmd+Enter shortcut — completed
### [DONE 2026-06-07T02:06Z] MOBILE: CodeMirror font-size 16px to prevent iOS zoom — completed
### [DONE 2026-06-07T01:08Z] MOBILE: Header tab nav scrollable on ≤640px, 44px touch targets — completed
### [DONE 2026-06-07T00:00Z] CONTENT: ch13-kernel-rbf-04, ch15-gini-impurity-04 — completed
