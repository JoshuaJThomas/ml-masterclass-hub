# Gardener Backlog

Prioritized list of improvements for future runs. Remove items when completed.

---

## High Priority

### BUG/UX: CodeMirror on mobile — scroll into view on focus
The iOS zoom issue (font-size < 16px) was fixed. Remaining: when the virtual keyboard opens, it may obscure the CodeMirror editor. Add a `focus` handler on the editor host element to call `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` so the editor stays visible when the keyboard pops up.

---

## Medium Priority

### CONTENT: Add exercises to ch24 — normalization pipeline (1 remaining)
ch24 now has 5 questions. One backlog topic remains: input normalization pipeline (apply train-fitted mean/std to test data using numpy). This is the last uncovered ch24 topic from the original list.

### CONTENT: Add exercises to ch07 (4 questions) — precision and recall
ch07 covers classification metrics. Not yet covered: precision, recall, F1 score from raw TP/FP/FN/TN counts using numpy (no sklearn).

### PWA: Web manifest + service worker for installability
Add a `manifest.json` (name, icons, display:standalone, theme_color) and a minimal service worker that caches the app shell for offline use. This makes the app installable on mobile home screens.

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

### UX: Active tab indicator in header persists across page load
The current view store is ephemeral (reset on reload). Save the last active tab to localStorage so reloading the page returns the user to where they were.

### MOBILE: Reduce container padding at narrow widths (≤375px)
The Practice and Learn containers use `var(--space-xxl)` (32px) vertical padding and the `.container` class has horizontal padding. At very narrow widths (iPhone SE: 375px) this wastes screen estate. Add a `@media (max-width: 400px)` rule to reduce padding to `var(--space-lg)` (16px) so more content is visible without scrolling.

### A11Y: Add aria-label to CodeMirror editor host
The CodeMirror editor host `<div>` has no accessible label, so screen readers announce only a generic "application" role. Add `aria-label="Python code editor"` (or "SQL code editor" when lang='sql') to the `.editor-host` element so assistive technology announces the editor's purpose.

### UX: Show Ctrl+Enter / Cmd+Enter hint tooltip near the Run button
Now that the keyboard shortcut works, surface it to users: add a `title` attribute to the Run button (e.g. `title="Run (Ctrl+Enter)"`) so hovering shows the hint. On Mac, detect `navigator.platform` or `navigator.userAgentData` to show `Cmd+Enter` instead. Small, reinforces discoverability.

### [DONE 2026-06-07] CONTENT: ch24 batch prediction + model metadata — completed

### UX: Show run-in-progress spinner or visual indicator in editor
When Ctrl+Enter is pressed and run() is already in flight, a user gets no feedback that the keypress was ignored. Consider a subtle pulse/glow on the editor border while `running` is true so it's clear something is happening and no-ops are expected.

### UX: Reset code to starterCode button
Add a small "Reset code" button (or link) below each editor that restores `code` to `current.starterCode`. Useful when a learner has mangled the starter code and wants a clean slate. Small, self-contained — one button + one line in Practice.svelte and Learn.svelte.

### CONTENT: ch07 precision/recall exercises
ch07 has only 4 questions and covers classification metrics. Not yet covered: precision from TP/FP counts (numpy division), recall from TP/FN counts, F1 harmonic mean of P and R. These are self-contained arithmetic exercises. Add 2 new exercises to reach coverage parity with other chapters.

### CONTENT: ch10 exercises (4 questions — joint-thinnest with ch13/14/15/16/18/19/20/21/22/23)
ch10 covers regularization (L1/L2 penalties). Not yet covered: manual L2 penalty gradient (add lambda*w to gradient), L1 sparse-solution check (soft-thresholding), elastic-net mixing parameter. Add 2 new exercises.

### UX: Keyboard navigation between exercises (n/p shortcuts)
Once Ctrl+Enter is established as the run shortcut, add Alt+N / Alt+P (or Ctrl+] / Ctrl+[) to move to the next/previous exercise without reaching for the mouse. Small change: intercept keydown on the page and call nextQuestion/prevQuestion. Helps power users flow through drills quickly.

### A11Y: Progress tab — announce score update via aria-live
When a new exercise is completed correctly and the score increments, screen readers don't know. Add `aria-live="polite"` to the score display element in the Progress tab so assistive technology announces the updated count immediately after the check passes.
