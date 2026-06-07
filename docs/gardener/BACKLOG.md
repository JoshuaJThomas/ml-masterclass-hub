# Gardener Backlog

Prioritized list of improvements for future runs. Remove items when completed.

---

## High Priority

### MOBILE: Stack teach/apply split on narrow screens
The Learn tab shows a two-column layout (lesson left, editor right). On screens <768px this should stack vertically. Add a CSS media query or Svelte responsive check so narrow screens see lesson content first, then the editor below. Touch targets on buttons should be ≥44px.

### MOBILE: Tab navigation usability on small screens
The 5-tab nav bar may overflow or have tiny tap targets on very narrow screens. Consider a horizontal scroll with `overflow-x: auto` and `white-space: nowrap`, or a bottom navigation bar pattern for mobile viewports.

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
