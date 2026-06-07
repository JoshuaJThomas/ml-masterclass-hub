# Gardener Backlog

Prioritized list of improvements for future runs. Remove items when completed.

---

## High Priority

### MOBILE: Stack teach/apply split on narrow screens
The Learn tab shows a two-column layout (lesson left, editor right). On screens <768px this should stack vertically. Add a CSS media query or Svelte responsive check so narrow screens see lesson content first, then the editor below. Touch targets on buttons should be ≥44px.

### BUG/UX: CodeMirror on mobile — keyboard and zoom issues
On iOS/Android, the CodeMirror editor can trigger unwanted zoom (font-size < 16px) and the virtual keyboard may obscure the editor. Set `font-size: 16px` on the editor, and ensure the editor container scrolls into view when focused.

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
