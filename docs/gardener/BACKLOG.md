# Gardener Backlog

Prioritized list of improvements for future runs. Remove items when completed.

---

## High Priority

### UX: Ctrl+Enter / Cmd+Enter keyboard shortcut to run code
Add a CodeMirror keymap so pressing Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac) triggers the Run action in Practice, Learn, and SQL tabs. Pass an optional `onRun` prop to CodeEditor and wire it into a custom keymap extension — small, self-contained, high ergonomic value.

### BUG/UX: CodeMirror on mobile — scroll into view on focus
The iOS zoom issue (font-size < 16px) was fixed. Remaining: when the virtual keyboard opens, it may obscure the CodeMirror editor. Add a `focus` handler on the editor host element to call `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` so the editor stays visible when the keyboard pops up.

---

## Medium Priority

### CONTENT: Add exercises to ch24 (3 questions — thinnest chapter)
ch24 covers model deployment. New topics not yet covered: input normalization pipeline (apply train-fitted scaler to test data), batch prediction loop, model versioning/metadata dict.

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
