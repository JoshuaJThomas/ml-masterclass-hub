# FSRS Memory Engine & Daily Set Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the date-seeded daily pick with a real spaced-repetition engine: each exercise becomes an FSRS card stored per-device in localStorage, auto-graded from the run result, and the daily set = cards due today + a few new cards (older chapters first).

**Architecture:** A thin `scheduler.js` wraps `ts-fsrs` (new card, grade, due check, JSON revive, outcome→rating mapping). `progress.js` persists an `{ id: card }` map in localStorage (injectable storage for tests). `dailySet.js` is a pure builder of today's set. `Practice.svelte` is rewired to grade on the first terminal outcome and show due/new counts.

**Tech Stack:** Svelte 5, Vitest, `ts-fsrs` (FSRS algorithm).

---

## File Structure

- `src/lib/srs/scheduler.js` — ts-fsrs wrapper: `newCard`, `reviveCard`, `grade`, `isDue`, `ratingFor`, re-export `Rating`.
- `src/lib/srs/progress.js` — localStorage map: `loadProgress`, `saveProgress`, `recordReview`.
- `src/lib/srs/dailySet.js` — pure `buildDailySet(...)`.
- `*.test.js` for each of the three.
- Modify: `src/lib/views/Practice.svelte` (use the engine), `package.json` (ts-fsrs dep).

---

## Task 1: Add ts-fsrs and the scheduler wrapper

**Files:** Create `src/lib/srs/scheduler.js`, `src/lib/srs/scheduler.test.js`. Modify `package.json` (dep).

- [ ] **Step 1: Install ts-fsrs**
```bash
npm install ts-fsrs
```

- [ ] **Step 2: Write the failing test** — `src/lib/srs/scheduler.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { newCard, grade, isDue, reviveCard, ratingFor, Rating } from './scheduler.js';

const t0 = new Date('2026-06-04T00:00:00Z');

describe('scheduler', () => {
  it('creates a new card that is due now', () => {
    const card = newCard(t0);
    expect(isDue(card, t0)).toBe(true);
  });

  it('grades Good to a later due date than Again', () => {
    const base = newCard(t0);
    const good = grade(base, Rating.Good, t0);
    const again = grade(base, Rating.Again, t0);
    expect(new Date(good.due) > new Date(again.due)).toBe(true);
  });

  it('survives a JSON round-trip and can still be graded', () => {
    const card = grade(newCard(t0), Rating.Good, t0);
    const restored = reviveCard(JSON.parse(JSON.stringify(card)));
    const next = grade(restored, Rating.Good, new Date('2026-06-05T00:00:00Z'));
    expect(next.reps).toBe(2);
  });

  it('maps outcomes to ratings', () => {
    expect(ratingFor({ passed: true, usedHelp: false })).toBe(Rating.Good);
    expect(ratingFor({ passed: true, usedHelp: true })).toBe(Rating.Hard);
    expect(ratingFor({ passed: false, usedHelp: false })).toBe(Rating.Again);
  });
});
```

- [ ] **Step 3: Run `npm test`** — Expected FAIL.

- [ ] **Step 4: Implement `src/lib/srs/scheduler.js`:**
```js
import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs';

const engine = fsrs(generatorParameters({ enable_fuzz: false }));

export { Rating };

export function newCard(now = new Date()) {
  return createEmptyCard(now);
}

// ts-fsrs cards have Date fields; after JSON storage they are ISO strings. Revive them.
export function reviveCard(card) {
  return {
    ...card,
    due: new Date(card.due),
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  };
}

export function grade(card, rating, now = new Date()) {
  return engine.next(reviveCard(card), now, rating).card;
}

export function isDue(card, now = new Date()) {
  return new Date(card.due) <= now;
}

// Map a practice outcome to an FSRS rating.
export function ratingFor({ passed, usedHelp }) {
  if (!passed) return Rating.Again;
  return usedHelp ? Rating.Hard : Rating.Good;
}
```

- [ ] **Step 5: Run `npm test`** — Expected PASS.

- [ ] **Step 6: Commit**
```bash
git add package.json package-lock.json src/lib/srs/scheduler.js src/lib/srs/scheduler.test.js
git commit -m "feat: ts-fsrs scheduler wrapper (new/grade/due/revive/rating)"
```

---

## Task 2: localStorage progress store

**Files:** Create `src/lib/srs/progress.js`, `src/lib/srs/progress.test.js`.

- [ ] **Step 1: Write the failing test** — `src/lib/srs/progress.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { loadProgress, saveProgress, recordReview } from './progress.js';

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  };
}

describe('progress', () => {
  it('returns {} when nothing stored', () => {
    expect(loadProgress(fakeStorage())).toEqual({});
  });

  it('saves and loads a map', () => {
    const s = fakeStorage();
    saveProgress({ 'ch01-x-01': { reps: 1 } }, s);
    expect(loadProgress(s)).toEqual({ 'ch01-x-01': { reps: 1 } });
  });

  it('recordReview merges one card and persists it', () => {
    const s = fakeStorage();
    recordReview('ch01-x-01', { reps: 1 }, s);
    const m = recordReview('ch02-y-02', { reps: 3 }, s);
    expect(Object.keys(m).sort()).toEqual(['ch01-x-01', 'ch02-y-02']);
    expect(loadProgress(s)['ch02-y-02']).toEqual({ reps: 3 });
  });

  it('returns {} on corrupt storage', () => {
    const s = { getItem: () => '{not json', setItem: () => {} };
    expect(loadProgress(s)).toEqual({});
  });
});
```

- [ ] **Step 2: Run `npm test`** — Expected FAIL.

- [ ] **Step 3: Implement `src/lib/srs/progress.js`:**
```js
const KEY = 'mlhub.progress.v1';

function getStore(storage) {
  return storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
}

export function loadProgress(storage) {
  const store = getStore(storage);
  if (!store) return {};
  try {
    return JSON.parse(store.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function saveProgress(map, storage) {
  const store = getStore(storage);
  if (!store) return;
  store.setItem(KEY, JSON.stringify(map));
}

export function recordReview(id, card, storage) {
  const map = loadProgress(storage);
  map[id] = card;
  saveProgress(map, storage);
  return map;
}
```

- [ ] **Step 4: Run `npm test`** — Expected PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/srs/progress.js src/lib/srs/progress.test.js
git commit -m "feat: localStorage-backed SRS progress store"
```

---

## Task 3: Daily-set builder (pure)

**Files:** Create `src/lib/srs/dailySet.js`, `src/lib/srs/dailySet.test.js`.

- [ ] **Step 1: Write the failing test** — `src/lib/srs/dailySet.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { buildDailySet } from './dailySet.js';

const now = new Date('2026-06-10T00:00:00Z');
const past = new Date('2026-06-01T00:00:00Z').toISOString();
const future = new Date('2026-06-20T00:00:00Z').toISOString();

const questions = [
  { id: 'ch01-a-01', chapter: 1 },
  { id: 'ch01-b-02', chapter: 1 },
  { id: 'ch03-c-01', chapter: 3 },
  { id: 'ch05-d-01', chapter: 5 },
  { id: 'ch09-e-01', chapter: 9 }, // out of scope (completedThrough 8)
];

describe('buildDailySet', () => {
  it('includes seen cards that are due, excludes not-yet-due', () => {
    const progress = {
      'ch01-a-01': { due: past },   // due
      'ch03-c-01': { due: future }, // not due
    };
    const { due } = buildDailySet(questions, 8, progress, now, 5);
    expect(due.map((q) => q.id)).toEqual(['ch01-a-01']);
  });

  it('new cards are unseen, in scope, older chapters first, capped at newLimit', () => {
    const { fresh } = buildDailySet(questions, 8, {}, now, 2);
    expect(fresh.map((q) => q.id)).toEqual(['ch01-a-01', 'ch01-b-02']);
  });

  it('never includes chapters beyond completedThrough', () => {
    const { all } = buildDailySet(questions, 8, {}, now, 99);
    expect(all.some((q) => q.chapter > 8)).toBe(false);
  });

  it('all = due then fresh, no duplicates', () => {
    const progress = { 'ch01-a-01': { due: past } };
    const { all } = buildDailySet(questions, 8, progress, now, 5);
    const ids = all.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('ch01-a-01');
  });
});
```

- [ ] **Step 2: Run `npm test`** — Expected FAIL.

- [ ] **Step 3: Implement `src/lib/srs/dailySet.js`:**
```js
import { isDue } from './scheduler.js';

// Build today's practice set: due (seen & due) + fresh (unseen, older chapters first).
export function buildDailySet(questions, completedThrough, progress, now = new Date(), newLimit = 5) {
  const inScope = questions.filter((q) => q.chapter <= completedThrough);

  const due = inScope.filter((q) => progress[q.id] && isDue(progress[q.id], now));

  const fresh = inScope
    .filter((q) => !progress[q.id])
    .sort((a, b) => a.chapter - b.chapter || a.id.localeCompare(b.id))
    .slice(0, newLimit);

  return { due, fresh, all: [...due, ...fresh] };
}
```

- [ ] **Step 4: Run `npm test`** — Expected PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/srs/dailySet.js src/lib/srs/dailySet.test.js
git commit -m "feat: pure daily-set builder (due + fresh, older chapters first)"
```

---

## Task 4: Wire the engine into Practice

**Files:** Modify `src/lib/views/Practice.svelte`.

- [ ] **Step 1: Replace the contents of `src/lib/views/Practice.svelte`** with the version below. Changes from the current file: it builds the set from progress via `buildDailySet`, tracks whether help was used, grades the card on the first terminal outcome (a pass, or revealing the solution) and persists it, and shows due/new counts.
```svelte
<script>
  import { onMount } from 'svelte';
  import CodeEditor from '../components/CodeEditor.svelte';
  import { loadBank } from '../bank/loadBank.js';
  import { buildDailySet } from '../srs/dailySet.js';
  import { newCard, grade, ratingFor } from '../srs/scheduler.js';
  import { loadProgress, recordReview } from '../srs/progress.js';
  import { getPyodide, runCode } from '../runner/pyodideRunner.js';

  let loading = $state(true);
  let loadError = $state('');
  let exercises = $state([]);
  let counts = $state({ due: 0, fresh: 0 });
  let index = $state(0);
  let code = $state('');
  let showHint = $state(false);
  let showSolution = $state(false);
  let usedHelp = $state(false);
  let graded = $state(new Set());
  let status = $state('');
  let running = $state(false);
  let result = $state(null);

  const today = () => new Date();
  const current = $derived(exercises[index]);

  onMount(async () => {
    try {
      const { meta, questions } = await loadBank(import.meta.env.BASE_URL);
      const progress = loadProgress();
      const set = buildDailySet(questions, meta.completedThrough, progress, today(), 5);
      exercises = set.all;
      counts = { due: set.due.length, fresh: set.fresh.length };
      if (exercises.length) resetForCurrent();
    } catch (e) {
      loadError = String(e.message || e);
    } finally {
      loading = false;
    }
  });

  function resetForCurrent() {
    code = current?.starterCode ?? '';
    showHint = false; showSolution = false; usedHelp = false; result = null;
  }

  function go(delta) {
    index = Math.max(0, Math.min(exercises.length - 1, index + delta));
    resetForCurrent();
  }

  // Grade an exercise once (first terminal outcome) and persist the updated card.
  function gradeOnce(passed) {
    if (!current || graded.has(current.id)) return;
    graded.add(current.id);
    const progress = loadProgress();
    const card = progress[current.id] ?? newCard();
    const next = grade(card, ratingFor({ passed, usedHelp }), new Date());
    recordReview(current.id, next);
  }

  function revealSolution() {
    showSolution = !showSolution;
    if (showSolution) { usedHelp = true; gradeOnce(false); }
  }

  function toggleHint() {
    showHint = !showHint;
    if (showHint) usedHelp = true;
  }

  async function run() {
    running = true; result = null;
    try {
      const pyodide = await getPyodide((s) => (status = s));
      result = await runCode(pyodide, code, current.check);
      if (result.passed) gradeOnce(true);
    } catch (e) {
      result = { passed: false, stdout: '', error: String(e.message || e) };
    } finally {
      running = false; status = '';
    }
  }
</script>

<section class="container pad">
  {#if loading}
    <p class="mono-label">LOADING…</p>
  {:else if loadError}
    <p class="mono-label" style="color: var(--color-error)">COULD NOT LOAD EXERCISES</p>
    <p class="body-large">{loadError}</p>
  {:else if !exercises.length}
    <p class="mono-label">ALL CAUGHT UP</p>
    <p class="body-large" style="max-width: 640px;">Nothing is due right now and there are no new exercises in your completed chapters. Come back later, or finish another chapter to unlock more.</p>
  {:else}
    <div class="head">
      <p class="mono-label" style="color: var(--color-deep-green)">
        TODAY · {index + 1}/{exercises.length} · {counts.due} DUE · {counts.fresh} NEW
      </p>
      <div class="nav">
        <button class="btn-secondary" onclick={() => go(-1)} disabled={index === 0}>Prev</button>
        <button class="btn-secondary" onclick={() => go(1)} disabled={index === exercises.length - 1}>Next</button>
      </div>
    </div>

    <p class="mono-label" style="color: var(--color-muted)">CH {String(current.chapter).padStart(2, '0')} · {current.difficulty}</p>
    <h1 class="heading-feature">{current.topic}</h1>
    <p class="body-large" style="color: var(--color-body-muted); max-width: 720px;">{current.prompt}</p>

    <CodeEditor bind:value={code} />

    <div class="actions">
      <button class="btn-primary" onclick={run} disabled={running}>{running ? 'Running…' : 'Run'}</button>
      <button class="btn-secondary" onclick={toggleHint}>{showHint ? 'Hide hint' : 'Show hint'}</button>
      <button class="btn-secondary" onclick={revealSolution}>{showSolution ? 'Hide solution' : 'Reveal solution'}</button>
    </div>

    {#if status}<p class="micro">{status}</p>{/if}
    {#if showHint}<p class="hint">💡 {current.hint}</p>{/if}

    {#if result}
      <div class="result {result.passed ? 'ok' : 'bad'}">
        <strong>{result.passed ? '✓ Passed' : '✗ Not yet'}</strong>
        {#if result.error}<pre>{result.error}</pre>{/if}
        {#if result.stdout}<pre class="stdout">{result.stdout}</pre>{/if}
      </div>
    {/if}

    {#if showSolution}
      <details open class="solution">
        <summary class="mono-label">SOLUTION</summary>
        <pre>{current.solution}</pre>
      </details>
    {/if}
  {/if}
</section>

<style>
  .pad { padding: var(--space-xxl) 0 var(--space-section); }
  .head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-md); }
  .nav { display: flex; gap: var(--space-lg); }
  .actions { display: flex; gap: var(--space-xl); align-items: center; margin-top: var(--space-lg); flex-wrap: wrap; }
  .hint { background: var(--color-pale-green); border-radius: var(--radius-sm); padding: var(--space-md) var(--space-lg); max-width: 720px; }
  .result { margin-top: var(--space-lg); border-radius: var(--radius-sm); padding: var(--space-lg); border: 1px solid var(--color-hairline); }
  .result.ok { background: var(--color-pale-green); }
  .result.bad { background: var(--color-pale-blue); }
  .result pre, .solution pre { font-family: var(--font-mono); font-size: 13px; white-space: pre-wrap; margin: var(--space-sm) 0 0; }
  .result .stdout { color: var(--color-body-muted); }
  .solution { margin-top: var(--space-lg); border-top: 1px solid var(--color-hairline); padding-top: var(--space-lg); }
  h1 { margin: var(--space-sm) 0 var(--space-sm); }
</style>
```

- [ ] **Step 2: Verify** — run `npm run build` (no errors/warnings) and `npm test` (all pass).

- [ ] **Step 3: Commit**
```bash
git add src/lib/views/Practice.svelte
git commit -m "feat: drive Practice from the FSRS engine (due+new set, auto-grade, persist)"
```

---

## Self-Review

- **Spec coverage:** FSRS card state per exercise ✓ (T1); auto-grade from outcome (pass=Good, pass-with-help=Hard, fail/reveal=Again) ✓ (T1 ratingFor + T4 gradeOnce); per-device localStorage persistence ✓ (T2); daily set = due + new, older chapters first ✓ (T3); Practice rewired with due/new counts ✓ (T4). The progress map is the data the dashboard (next plan) will read.
- **Placeholder scan:** no TBDs; every module is fully implemented and unit-tested; Practice is given in full.
- **Type consistency:** card shape flows ts-fsrs ↔ `reviveCard`/`grade` ↔ stored JSON; `buildDailySet(questions, completedThrough, progress, now, newLimit)` → `{ due, fresh, all }` consumed exactly in Practice; `ratingFor({passed, usedHelp})`, `recordReview(id, card)`, `loadProgress()` signatures match their callers.
```
