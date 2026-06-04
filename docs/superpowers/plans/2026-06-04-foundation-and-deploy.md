# Foundation & Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a live, deployed static web app shell styled with the Cohere design system, with a CI deploy pipeline to GitHub Pages and a reusable design skill — the foundation every later plan builds on.

**Architecture:** A Vite + Svelte single-page static app. Design tokens are defined once in JS (`src/lib/design/tokens.js`), emitted as CSS custom properties on `:root`, and consumed by global styles and components. A simple store toggles between a "Practice" and "Progress" view (placeholders now; filled by later plans). GitHub Actions builds the static output and deploys it to GitHub Pages on every push to `main`.

**Tech Stack:** Vite, Svelte 5, Vitest (unit tests), GitHub Actions, GitHub Pages. Fonts via Google Fonts CDN as documented fallbacks for the proprietary Cohere faces.

---

## File Structure

- `package.json`, `vite.config.js`, `index.html` — Vite + Svelte project config and entry.
- `src/main.js` — app bootstrap; injects design tokens, mounts `App.svelte`.
- `src/App.svelte` — top-level shell: header + view switch + footer.
- `src/lib/design/tokens.js` — **single source of truth** for design tokens + `cssVars()`.
- `src/lib/design/tokens.test.js` — Vitest unit tests for the token module.
- `src/lib/design/global.css` — global element styles + font stacks + type-scale classes, consuming the CSS variables.
- `src/lib/stores/view.js` — Svelte store for the active view (`'practice' | 'progress'`).
- `src/lib/components/Header.svelte` — Cohere-style top nav.
- `src/lib/views/PracticePlaceholder.svelte`, `src/lib/views/ProgressPlaceholder.svelte` — placeholder views.
- `.github/workflows/deploy.yml` — build + deploy to GitHub Pages.
- `.claude/skills/cohere-design/SKILL.md` — reusable design skill pointing at `DESIGN.md`.

---

## Task 1: Scaffold Vite + Svelte + Vitest

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/App.svelte`
- Create: `vitest.config.js`

- [ ] **Step 1: Scaffold into a temp dir (non-interactive) and merge into the project root**

The project root already contains `DESIGN.md`, `docs/`, `.git/`, `.gitignore`. Scaffold into a temp folder to avoid the "directory not empty" prompt, then move the generated files in.

Run:
```bash
cd /root/claude/ml-practice
npm create vite@latest tmp-scaffold -- --template svelte
# move generated files (including dotfiles) into project root, then remove temp dir
cp -r tmp-scaffold/. .
rm -rf tmp-scaffold
```
Expected: `package.json`, `vite.config.js`, `index.html`, `src/` now exist in the project root. (If `cp` reports it skipped `.git`, that is fine — the temp scaffold has no `.git`.)

- [ ] **Step 2: Add Vitest and jsdom as dev dependencies and a test script**

Run:
```bash
npm install -D vitest jsdom
```

Then edit `package.json` so the `"scripts"` block is exactly:
```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
```

- [ ] **Step 3: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
  },
});
```

- [ ] **Step 4: Install and verify the build works**

Run:
```bash
npm install
npm run build
```
Expected: build completes, a `dist/` directory is produced with `index.html` and assets, no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + Svelte + Vitest project"
```

---

## Task 2: Design tokens as code (single source of truth)

**Files:**
- Create: `src/lib/design/tokens.js`
- Test: `src/lib/design/tokens.test.js`
- Create: `src/lib/design/global.css`

- [ ] **Step 1: Write the failing test**

`src/lib/design/tokens.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { tokens, cssVars } from './tokens.js';

describe('design tokens', () => {
  it('exposes the Cohere primary and deep-green colors', () => {
    expect(tokens.colors.primary).toBe('#17171c');
    expect(tokens.colors['deep-green']).toBe('#003c33');
  });

  it('cssVars() emits CSS custom properties for colors, radii, and spacing', () => {
    const css = cssVars();
    expect(css).toContain('--color-primary: #17171c;');
    expect(css).toContain('--radius-pill: 32px;');
    expect(css).toContain('--space-section: 80px;');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./tokens.js`.

- [ ] **Step 3: Implement `src/lib/design/tokens.js`**

Values transcribed verbatim from `DESIGN.md`.
```js
export const tokens = {
  colors: {
    primary: '#17171c',
    'cohere-black': '#000000',
    ink: '#212121',
    'deep-green': '#003c33',
    'dark-navy': '#071829',
    canvas: '#ffffff',
    'soft-stone': '#eeece7',
    'pale-green': '#edfce9',
    'pale-blue': '#f1f5ff',
    hairline: '#d9d9dd',
    'border-light': '#e5e7eb',
    'card-border': '#f2f2f2',
    muted: '#93939f',
    slate: '#75758a',
    'body-muted': '#616161',
    'action-blue': '#1863dc',
    'focus-blue': '#4c6ee6',
    coral: '#ff7759',
    'coral-soft': '#ffad9b',
    'form-focus': '#9b60aa',
    'on-primary': '#ffffff',
    'on-dark': '#ffffff',
    error: '#b30000',
  },
  radius: {
    xs: '4px', sm: '8px', md: '16px', lg: '22px', xl: '30px', pill: '32px', full: '9999px',
  },
  space: {
    xxs: '2px', xs: '6px', sm: '8px', md: '12px', lg: '16px', xl: '24px', xxl: '32px', section: '80px',
  },
  font: {
    display: "'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif",
    body: "'Inter', Arial, ui-sans-serif, system-ui, sans-serif",
    mono: "'Space Mono', ui-monospace, 'Courier New', monospace",
  },
};

function emit(prefix, obj) {
  return Object.entries(obj)
    .map(([k, v]) => `  --${prefix}-${k}: ${v};`)
    .join('\n');
}

export function cssVars() {
  return [
    ':root {',
    emit('color', tokens.colors),
    emit('radius', tokens.radius),
    emit('space', tokens.space),
    `  --font-display: ${tokens.font.display};`,
    `  --font-body: ${tokens.font.body};`,
    `  --font-mono: ${tokens.font.mono};`,
    '}',
  ].join('\n');
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS (2 tests).

- [ ] **Step 5: Create `src/lib/design/global.css`**

Global styles + type scale (sizes/line-heights/tracking from `DESIGN.md`), consuming the variables. `:root` itself is injected at runtime in Task 3.
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Space+Grotesk:wght@400;500&family=Space+Mono&display=swap');

* { box-sizing: border-box; }

html, body {
  margin: 0;
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

a { color: var(--color-action-blue); text-decoration: none; }
a:hover { text-decoration: underline; }

.display-hero { font-family: var(--font-display); font-size: 96px; line-height: 1; letter-spacing: -1.92px; font-weight: 400; }
.heading-section { font-family: var(--font-body); font-size: 48px; line-height: 1.2; letter-spacing: -0.48px; font-weight: 400; }
.heading-card { font-family: var(--font-body); font-size: 32px; line-height: 1.2; letter-spacing: -0.32px; font-weight: 400; }
.heading-feature { font-family: var(--font-body); font-size: 24px; line-height: 1.3; font-weight: 400; }
.body-large { font-size: 18px; line-height: 1.4; }
.mono-label { font-family: var(--font-mono); font-size: 14px; line-height: 1.4; letter-spacing: 0.28px; text-transform: uppercase; }
.micro { font-size: 12px; line-height: 1.4; color: var(--color-muted); }

.btn-primary {
  background: var(--color-primary); color: var(--color-on-primary);
  font-family: var(--font-body); font-size: 14px; font-weight: 500;
  border: none; border-radius: var(--radius-pill); padding: 12px 24px; cursor: pointer;
}
.btn-primary:hover { opacity: 0.92; }
.btn-secondary {
  background: transparent; color: var(--color-ink);
  border: none; padding: 8px 0; cursor: pointer; text-decoration: underline; font-size: 16px;
}

.card {
  background: var(--color-canvas); border: 1px solid var(--color-card-border);
  border-radius: var(--radius-lg); padding: var(--space-xl);
}
.container { max-width: 1100px; margin: 0 auto; padding: 0 var(--space-xl); }
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/design
git commit -m "feat: add Cohere design tokens (tested) and global styles"
```

---

## Task 3: App shell (header, view switch, token injection)

**Files:**
- Create: `src/lib/stores/view.js`
- Create: `src/lib/components/Header.svelte`
- Create: `src/lib/views/PracticePlaceholder.svelte`
- Create: `src/lib/views/ProgressPlaceholder.svelte`
- Modify: `src/main.js`
- Modify: `src/App.svelte`

- [ ] **Step 1: Create the view store**

`src/lib/stores/view.js`:
```js
import { writable } from 'svelte/store';

// 'practice' | 'progress'
export const view = writable('practice');
```

- [ ] **Step 2: Inject tokens at boot in `src/main.js`**

Replace the entire contents of `src/main.js` with:
```js
import './lib/design/global.css';
import { mount } from 'svelte';
import { cssVars } from './lib/design/tokens.js';
import App from './App.svelte';

// Inject design tokens as :root custom properties (single source of truth).
const styleEl = document.createElement('style');
styleEl.textContent = cssVars();
document.head.appendChild(styleEl);

const app = mount(App, { target: document.getElementById('app') });
export default app;
```

Note: ensure `index.html` has `<div id="app"></div>` and `<script type="module" src="/src/main.js"></script>` (the Vite svelte template provides this; adjust the target id if the template used a different one).

- [ ] **Step 3: Create the Header component**

`src/lib/components/Header.svelte` (Cohere three-zone nav: brand left, centered tabs, right slot):
```svelte
<script>
  import { view } from '../stores/view.js';
</script>

<header>
  <div class="container bar">
    <span class="brand mono-label">ML · MASTERCLASS</span>
    <nav>
      <button class:active={$view === 'practice'} on:click={() => view.set('practice')}>Practice</button>
      <button class:active={$view === 'progress'} on:click={() => view.set('progress')}>Progress</button>
    </nav>
    <span class="micro">v0.1</span>
  </div>
</header>

<style>
  header { border-bottom: 1px solid var(--color-hairline); background: var(--color-canvas); }
  .bar { display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .brand { letter-spacing: 0.28px; }
  nav { display: flex; gap: var(--space-xl); }
  nav button {
    background: none; border: none; cursor: pointer; font-family: var(--font-body);
    font-size: 16px; color: var(--color-muted); padding: 4px 0;
    border-bottom: 2px solid transparent;
  }
  nav button.active { color: var(--color-ink); border-bottom-color: var(--color-deep-green); }
</style>
```

- [ ] **Step 4: Create the two placeholder views**

`src/lib/views/PracticePlaceholder.svelte`:
```svelte
<section class="container pad">
  <p class="mono-label" style="color: var(--color-deep-green)">TODAY'S PRACTICE</p>
  <h1 class="heading-section">Practice is coming next.</h1>
  <p class="body-large" style="color: var(--color-body-muted); max-width: 640px;">
    This is where your daily, spaced-repetition coding exercises will appear — written and
    run right in the browser. The interactive runner and memory engine land in the next plans.
  </p>
</section>

<style>.pad { padding: var(--space-section) 0; }</style>
```

`src/lib/views/ProgressPlaceholder.svelte`:
```svelte
<section class="container pad">
  <p class="mono-label" style="color: var(--color-deep-green)">YOUR PROGRESS</p>
  <h1 class="heading-section">Your hub will live here.</h1>
  <p class="body-large" style="color: var(--color-body-muted); max-width: 640px;">
    Per-chapter mastery, your streak, and a practice heatmap will fill this dashboard once
    the memory engine is in place.
  </p>
</section>

<style>.pad { padding: var(--space-section) 0; }</style>
```

- [ ] **Step 5: Wire up `src/App.svelte`**

Replace the entire contents of `src/App.svelte` with:
```svelte
<script>
  import Header from './lib/components/Header.svelte';
  import PracticePlaceholder from './lib/views/PracticePlaceholder.svelte';
  import ProgressPlaceholder from './lib/views/ProgressPlaceholder.svelte';
  import { view } from './lib/stores/view.js';
</script>

<Header />
<main>
  {#if $view === 'practice'}
    <PracticePlaceholder />
  {:else}
    <ProgressPlaceholder />
  {/if}
</main>
<footer class="container">
  <span class="micro">Personal ML learning hub · built with Claude</span>
</footer>

<style>
  main { min-height: 70vh; }
  footer { padding: var(--space-xl) 0; border-top: 1px solid var(--color-hairline); margin-top: var(--space-section); }
</style>
```

- [ ] **Step 6: Verify the dev server renders the shell**

Run (in the background, then check, then stop):
```bash
npm run build
```
Expected: build succeeds with no Svelte/import errors. (For a visual check the implementer may run `npm run dev` and open the local URL; the build passing is the gating check here.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: app shell with Cohere-styled header and view switch"
```

---

## Task 4: GitHub Pages deploy pipeline

**Files:**
- Modify: `vite.config.js`
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Set the Vite base path for project Pages**

GitHub project Pages serve from `https://<user>.github.io/<repo>/`, so assets need a base of `/<repo>/`. Edit `vite.config.js` to set `base` from an env var (so it works locally and in CI). The file should read:
```js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [svelte()],
});
```

- [ ] **Step 2: Create the deploy workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Build
        run: npm run build
        env:
          VITE_BASE: /${{ github.event.repository.name }}/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Generate a package-lock for `npm ci`**

`npm ci` requires a committed lockfile. Confirm one exists:
```bash
ls package-lock.json
```
Expected: file exists (created by `npm install` in Task 1). If missing, run `npm install` to generate it.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "ci: build and deploy static site to GitHub Pages"
```

- [ ] **Step 5: MANUAL — create the GitHub repo and enable Pages (user action)**

The `gh` CLI is not installed here, so the repo owner does this once:
1. On github.com, create a new repository (e.g. `ml-masterclass-hub`). Do **not** add a README/license (this repo already has commits).
2. Locally, add the remote and push:
   ```bash
   git remote add origin https://github.com/<your-username>/ml-masterclass-hub.git
   git branch -M main
   git push -u origin main
   ```
   (Use a personal access token / credential helper when prompted — this is an interactive login; in this session run it prefixed with `! ` so the prompt is handled.)
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions.**
4. The push triggers the workflow; the site goes live at `https://<your-username>.github.io/ml-masterclass-hub/`.

Expected: the Actions run is green and the URL renders the shell (header + "Practice is coming next.").

---

## Task 5: Package the Cohere design system as a reusable skill

**Files:**
- Create: `.claude/skills/cohere-design/SKILL.md`

- [ ] **Step 1: Author the skill**

`.claude/skills/cohere-design/SKILL.md`:
```markdown
---
name: cohere-design
description: Use before writing or editing ANY UI in this project — applies the Cohere design system (tokens, type, components) and its restraint rules so every screen, including night-agent-generated UI, stays visually consistent.
---

# Cohere Design System (project UI rules)

Before writing or changing any UI, read `DESIGN.md` at the project root — it is the full
spec (colors, typography, radii, spacing, components, do's and don'ts).

## Hard rules
- Tokens come from `src/lib/design/tokens.js` → CSS variables (`--color-*`, `--radius-*`,
  `--space-*`, `--font-*`). Never hardcode hex/px that a token already covers.
- Default surface is canvas white (`--color-canvas`). Use deep green (`--color-deep-green`)
  or dark navy (`--color-dark-navy`) only as full-width emphasis bands.
- Primary action = near-black pill (`.btn-primary`). Secondary = underlined text link.
- Card radii are 8px (`--radius-sm`) or 22px (`--radius-lg`). No card radius below 8px.
- Depth is flat: thin hairline borders, NOT drop shadows.
- Type split: display = `--font-display`, body/UI = `--font-body`, technical labels =
  `--font-mono` (uppercase mono labels).

## Gamification adaptation (this project)
Streaks, XP, mastery and heatmaps must stay calm and "research-lab", not cartoonish:
- Use mono labels, hairline rules, and `--color-deep-green` / `--color-pale-green`
  accents. Coral (`--color-coral`) is for small editorial chips only.
- Never turn coral/blue into broad decorative fills. No heavy shadows or loud badges.

## Don'ts
- No saturated gradient UI backgrounds (gradients are media-led only).
- Don't replace the display/body/mono split with one generic sans.
- Don't box every section; Cohere uses open space, rules, and unframed rows too.
```

- [ ] **Step 2: Verify the skill file is valid frontmatter**

Run:
```bash
head -4 .claude/skills/cohere-design/SKILL.md
```
Expected: shows the `---` frontmatter block with `name:` and `description:`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/cohere-design/SKILL.md
git commit -m "docs: add reusable cohere-design skill"
```

---

## Self-Review

- **Spec coverage (foundation slice):** static GitHub Pages hosting ✓ (Task 4); Cohere
  `DESIGN.md` styling ✓ (Tasks 2–3); design system as a skill ✓ (Task 5); app shell with
  Practice/Progress hub navigation ✓ (Task 3). Pyodide runner, FSRS engine, bank, and
  dashboard are intentionally out of scope here — they are Plans 2–5.
- **Placeholder scan:** the two `*Placeholder.svelte` views are intentional, labeled
  placeholders for later plans, not plan placeholders; all steps contain real code/commands.
- **Type consistency:** `tokens`/`cssVars` exports match their test and `main.js` usage;
  the `view` store values (`'practice'`/`'progress'`) match `Header.svelte` and `App.svelte`;
  `VITE_BASE` is read in `vite.config.js` and set in the workflow.
```
