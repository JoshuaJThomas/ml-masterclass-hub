# Pyodide Runner & Exercise View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn the static question bank into interactive practice: the Practice view loads the bank, presents a date-seeded daily set of exercises, and lets the user write Python in an editor, run it in-browser via Pyodide, and see pass/fail with output, hints, and a reveal-solution option.

**Architecture:** Pure logic (bank fetch, daily selection, result shaping) lives in small tested modules. Pyodide is lazy-loaded from CDN on first run, with numpy/pandas/matplotlib. The Practice view composes a CodeEditor (textarea-based) + Run button + result panel. Styling follows the `cohere-design` skill / `DESIGN.md`.

**Tech Stack:** Svelte 5, Vitest (logic), Pyodide v0.27.7 (CDN, runtime/browser-only).

---

## File Structure

- `src/lib/bank/loadBank.js` — async fetch of `bank/questions.json` + `bank/meta.json`.
- `src/lib/bank/selectDaily.js` — pure: filter by `completedThrough` + date-seeded pick of N.
- `src/lib/bank/selectDaily.test.js`, `src/lib/bank/loadBank.test.js` — Vitest.
- `src/lib/runner/pyodideRunner.js` — lazy Pyodide loader + `runCode` + pure `shapeResult`.
- `src/lib/runner/shapeResult.test.js` — Vitest for the pure result-shaping helper.
- `src/lib/components/CodeEditor.svelte` — textarea editor (monospace, tab support).
- `src/lib/views/Practice.svelte` — the interactive practice view.
- Modify: `src/App.svelte` (use Practice), `.github/workflows/deploy.yml` (Node24 opt-in).

---

## Task 1: Bank loader (fetch)

**Files:** Create `src/lib/bank/loadBank.js`, `src/lib/bank/loadBank.test.js`.

- [ ] **Step 1: Write the failing test** — `src/lib/bank/loadBank.test.js`:
```js
import { describe, it, expect, vi } from 'vitest';
import { loadBank } from './loadBank.js';

describe('loadBank', () => {
  it('fetches meta and questions relative to base and returns them', async () => {
    const meta = { completedThrough: 8, currentChapter: 8, generatedAt: '2026-06-04' };
    const questions = [{ id: 'ch01-x-01', chapter: 1 }];
    const fetchMock = vi.fn((url) =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(url.includes('meta') ? meta : questions) })
    );
    const result = await loadBank('/base/', fetchMock);
    expect(fetchMock).toHaveBeenCalledWith('/base/bank/meta.json');
    expect(fetchMock).toHaveBeenCalledWith('/base/bank/questions.json');
    expect(result).toEqual({ meta, questions });
  });

  it('throws a helpful error when a fetch is not ok', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: false, status: 404 }));
    await expect(loadBank('/base/', fetchMock)).rejects.toThrow(/bank/i);
  });
});
```

- [ ] **Step 2: Run `npm test`** — Expected FAIL (cannot resolve `./loadBank.js`).

- [ ] **Step 3: Implement `src/lib/bank/loadBank.js`:**
```js
// Loads the question bank. `base` is import.meta.env.BASE_URL (ends with '/').
// `fetchFn` is injectable for testing; defaults to global fetch.
export async function loadBank(base, fetchFn = fetch) {
  async function getJson(name) {
    const res = await fetchFn(`${base}bank/${name}`);
    if (!res.ok) throw new Error(`Failed to load bank file ${name} (status ${res.status})`);
    return res.json();
  }
  const [meta, questions] = await Promise.all([getJson('meta.json'), getJson('questions.json')]);
  return { meta, questions };
}
```

- [ ] **Step 4: Run `npm test`** — Expected PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/bank/loadBank.js src/lib/bank/loadBank.test.js
git commit -m "feat: bank loader with injectable fetch"
```

---

## Task 2: Date-seeded daily selection (pure)

**Files:** Create `src/lib/bank/selectDaily.js`, `src/lib/bank/selectDaily.test.js`.

- [ ] **Step 1: Write the failing test** — `src/lib/bank/selectDaily.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { selectDaily } from './selectDaily.js';

const bank = [];
for (let ch = 1; ch <= 10; ch++) {
  for (let i = 1; i <= 3; i++) bank.push({ id: `ch${String(ch).padStart(2,'0')}-t-0${i}`, chapter: ch });
}

describe('selectDaily', () => {
  it('only includes chapters <= completedThrough', () => {
    const picked = selectDaily(bank, 5, '2026-06-04', 5);
    expect(picked.every((q) => q.chapter <= 5)).toBe(true);
  });

  it('returns exactly n items when enough are in scope', () => {
    expect(selectDaily(bank, 8, '2026-06-04', 5)).toHaveLength(5);
  });

  it('is deterministic for the same date', () => {
    const a = selectDaily(bank, 8, '2026-06-04', 5).map((q) => q.id);
    const b = selectDaily(bank, 8, '2026-06-04', 5).map((q) => q.id);
    expect(a).toEqual(b);
  });

  it('differs across dates (usually)', () => {
    const a = selectDaily(bank, 8, '2026-06-04', 5).map((q) => q.id).join();
    const b = selectDaily(bank, 8, '2026-06-05', 5).map((q) => q.id).join();
    expect(a).not.toEqual(b);
  });

  it('returns no duplicates', () => {
    const ids = selectDaily(bank, 8, '2026-06-04', 5).map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('caps at the number available when fewer than n', () => {
    expect(selectDaily(bank, 1, '2026-06-04', 5)).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run `npm test`** — Expected FAIL.

- [ ] **Step 3: Implement `src/lib/bank/selectDaily.js`:**
```js
// Deterministic daily pick: same date => same set (cross-device consistent for now).
// Spaced-repetition weighting toward older chapters arrives with the FSRS engine (later plan).

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function selectDaily(questions, completedThrough, dateStr, n = 5) {
  const pool = questions.filter((q) => q.chapter <= completedThrough);
  const rand = mulberry32(hashString(dateStr));
  // Fisher-Yates shuffle driven by the seeded PRNG, then take n.
  const arr = pool.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(n, arr.length));
}
```

- [ ] **Step 4: Run `npm test`** — Expected PASS (all 6 selectDaily cases).

- [ ] **Step 5: Commit**
```bash
git add src/lib/bank/selectDaily.js src/lib/bank/selectDaily.test.js
git commit -m "feat: deterministic date-seeded daily exercise selection"
```

---

## Task 3: Pyodide runner

**Files:** Create `src/lib/runner/pyodideRunner.js`, `src/lib/runner/shapeResult.test.js`.

- [ ] **Step 1: Write the failing test** for the pure result shaper — `src/lib/runner/shapeResult.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { shapeResult } from './pyodideRunner.js';

describe('shapeResult', () => {
  it('reports pass when no error', () => {
    expect(shapeResult('out\n', null)).toEqual({ passed: true, stdout: 'out\n', error: null });
  });
  it('reports fail and extracts an AssertionError message', () => {
    const r = shapeResult('', new Error('Traceback...\nAssertionError: nope'));
    expect(r.passed).toBe(false);
    expect(r.error).toMatch(/AssertionError/);
  });
  it('treats a bare assertion (no message) as a failed check', () => {
    const r = shapeResult('', new Error('AssertionError'));
    expect(r.passed).toBe(false);
  });
});
```

- [ ] **Step 2: Run `npm test`** — Expected FAIL.

- [ ] **Step 3: Implement `src/lib/runner/pyodideRunner.js`:**
```js
const PYODIDE_VERSION = 'v0.27.7';
const CDN = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

let pyodidePromise = null;

// Lazily load Pyodide once, with the scientific packages our exercises use.
export function getPyodide(onStatus = () => {}) {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    onStatus('Loading Python…');
    if (!window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = `${CDN}pyodide.js`;
        s.onload = resolve;
        s.onerror = () => reject(new Error('Failed to load Pyodide script'));
        document.head.appendChild(s);
      });
    }
    const pyodide = await window.loadPyodide({ indexURL: CDN });
    onStatus('Loading numpy, pandas, matplotlib…');
    await pyodide.loadPackage(['numpy', 'pandas', 'matplotlib']);
    onStatus('');
    return pyodide;
  })();
  return pyodidePromise;
}

// Pure: turn (stdout, error|null) into a result object. Tested in isolation.
export function shapeResult(stdout, error) {
  if (!error) return { passed: true, stdout, error: null };
  const msg = String(error.message || error);
  // Show the most informative line (the AssertionError / exception line) if present.
  const line = msg.split('\n').reverse().find((l) => /Error|Exception/.test(l)) || msg.trim();
  return { passed: false, stdout, error: line };
}

// Run the user's code then the check, in a FRESH namespace each time.
// stdout is captured; any exception (including failed assertions) => failure.
export async function runCode(pyodide, userCode, checkCode) {
  const program = [
    'import sys, io',
    '_buf = io.StringIO()',
    '_old = sys.stdout',
    'sys.stdout = _buf',
    'try:',
    ..._indent(userCode),
    ..._indent(checkCode),
    'finally:',
    '    sys.stdout = _old',
    '_buf.getvalue()',
  ].join('\n');
  try {
    const stdout = await pyodide.runPythonAsync(program);
    return shapeResult(stdout ?? '', null);
  } catch (error) {
    // Recover any stdout printed before the error, if available.
    let stdout = '';
    try { stdout = pyodide.globals.get('_buf')?.getvalue() ?? ''; } catch { /* ignore */ }
    return shapeResult(stdout, error);
  }
}

function _indent(code) {
  return String(code).split('\n').map((l) => '    ' + l);
}
```

- [ ] **Step 4: Run `npm test`** — Expected PASS (shapeResult cases). Note: `getPyodide`/`runCode` are browser-only and not unit-tested here; they are exercised by the browser smoke test in Task 5.

- [ ] **Step 5: Verify the CDN URL resolves** — Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js
```
Expected: `200`.

- [ ] **Step 6: Commit**
```bash
git add src/lib/runner/pyodideRunner.js src/lib/runner/shapeResult.test.js
git commit -m "feat: lazy Pyodide loader and code runner with pure result shaping"
```

---

## Task 4: CodeEditor component + Practice view + wiring

**Files:** Create `src/lib/components/CodeEditor.svelte`, `src/lib/views/Practice.svelte`; modify `src/App.svelte`.

- [ ] **Step 1: Create `src/lib/components/CodeEditor.svelte`** (textarea editor, Svelte 5 `$bindable`, Tab inserts 4 spaces):
```svelte
<script>
  let { value = $bindable('') } = $props();
  function onKeydown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target;
      const s = el.selectionStart, en = el.selectionEnd;
      value = value.slice(0, s) + '    ' + value.slice(en);
      queueMicrotask(() => { el.selectionStart = el.selectionEnd = s + 4; });
    }
  }
</script>

<textarea
  class="editor"
  bind:value
  onkeydown={onKeydown}
  spellcheck="false"
  autocapitalize="off"
  autocomplete="off"
></textarea>

<style>
  .editor {
    width: 100%; min-height: 220px; resize: vertical;
    font-family: var(--font-mono); font-size: 14px; line-height: 1.5;
    color: var(--color-on-dark); background: var(--color-primary);
    border: 1px solid var(--color-hairline); border-radius: var(--radius-sm);
    padding: var(--space-lg); white-space: pre; overflow-wrap: normal; overflow-x: auto;
  }
  .editor:focus { outline: 2px solid var(--color-focus-blue); outline-offset: 1px; }
</style>
```

- [ ] **Step 2: Create `src/lib/views/Practice.svelte`** (loads bank, shows the daily set, runs code):
```svelte
<script>
  import { onMount } from 'svelte';
  import CodeEditor from '../components/CodeEditor.svelte';
  import { loadBank } from '../bank/loadBank.js';
  import { selectDaily } from '../bank/selectDaily.js';
  import { getPyodide, runCode } from '../runner/pyodideRunner.js';

  let loading = $state(true);
  let loadError = $state('');
  let exercises = $state([]);
  let index = $state(0);
  let code = $state('');
  let showHint = $state(false);
  let showSolution = $state(false);
  let status = $state('');
  let running = $state(false);
  let result = $state(null); // { passed, stdout, error }

  const today = () => new Date().toISOString().slice(0, 10);
  const current = $derived(exercises[index]);

  onMount(async () => {
    try {
      const { meta, questions } = await loadBank(import.meta.env.BASE_URL);
      exercises = selectDaily(questions, meta.completedThrough, today(), 5);
      if (exercises.length) resetForCurrent();
    } catch (e) {
      loadError = String(e.message || e);
    } finally {
      loading = false;
    }
  });

  function resetForCurrent() {
    code = current?.starterCode ?? '';
    showHint = false; showSolution = false; result = null;
  }

  function go(delta) {
    index = Math.max(0, Math.min(exercises.length - 1, index + delta));
    resetForCurrent();
  }

  async function run() {
    running = true; result = null;
    try {
      const pyodide = await getPyodide((s) => (status = s));
      result = await runCode(pyodide, code, current.check);
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
    <p class="mono-label">NO EXERCISES YET</p>
    <p class="body-large">Add notebooks and generate the bank to start practicing.</p>
  {:else}
    <div class="head">
      <p class="mono-label" style="color: var(--color-deep-green)">
        TODAY · {index + 1} / {exercises.length} · CH {String(current.chapter).padStart(2, '0')} · {current.difficulty}
      </p>
      <div class="nav">
        <button class="btn-secondary" onclick={() => go(-1)} disabled={index === 0}>Prev</button>
        <button class="btn-secondary" onclick={() => go(1)} disabled={index === exercises.length - 1}>Next</button>
      </div>
    </div>

    <h1 class="heading-feature">{current.topic}</h1>
    <p class="body-large" style="color: var(--color-body-muted); max-width: 720px;">{current.prompt}</p>

    <CodeEditor bind:value={code} />

    <div class="actions">
      <button class="btn-primary" onclick={run} disabled={running}>{running ? 'Running…' : 'Run'}</button>
      <button class="btn-secondary" onclick={() => (showHint = !showHint)}>{showHint ? 'Hide hint' : 'Show hint'}</button>
      <button class="btn-secondary" onclick={() => (showSolution = !showSolution)}>{showSolution ? 'Hide solution' : 'Reveal solution'}</button>
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
  h1 { margin: var(--space-lg) 0 var(--space-sm); }
</style>
```

- [ ] **Step 3: Wire `Practice` into `src/App.svelte`** — replace the `PracticePlaceholder` import and usage with `Practice`:
  - Change `import PracticePlaceholder from './lib/views/PracticePlaceholder.svelte';` to `import Practice from './lib/views/Practice.svelte';`
  - Change `<PracticePlaceholder />` to `<Practice />`.
  - Leave `ProgressPlaceholder` as-is (replaced in a later plan). Delete `src/lib/views/PracticePlaceholder.svelte`.

- [ ] **Step 4: Verify build** — run `npm run build` and `npm test`. Expected: build succeeds, all tests pass. (Pyodide only runs in a real browser; the build just bundles the code.)

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: interactive Practice view with code editor and Pyodide runner"
```

---

## Task 5: CI Node-24 opt-in + browser smoke test

**Files:** Modify `.github/workflows/deploy.yml`.

- [ ] **Step 1: Silence the Node-20 deprecation** — in `.github/workflows/deploy.yml`, add a top-level `env` block so JS actions run on Node 24:
```yaml
env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
```
Place it just after the `concurrency:` block (top level, same indentation as `on:`/`permissions:`).

- [ ] **Step 2: Commit**
```bash
git add .github/workflows/deploy.yml
git commit -m "ci: opt JS actions into Node 24 to clear deprecation warning"
```

- [ ] **Step 3: Browser smoke test (post-merge, best effort).** After this branch is merged and deployed, verify the live site actually runs Python. If a headless browser (Playwright/Chromium) is available, load `https://joshuajthomas.github.io/ml-masterclass-hub/`, switch to Practice, wait for an exercise, set the editor to a known-correct solution, click Run, and assert the result panel shows "Passed". If no browser is available in the environment, document that the runner is verified by code inspection + the unit-tested pure pieces, and leave a manual check note for the user. (This step does not block the merge.)

---

## Self-Review

- **Spec coverage:** bank fetch ✓ (T1); date-seeded daily set across completed chapters ✓ (T2); in-browser run-and-check via Pyodide with numpy/pandas/matplotlib ✓ (T3); editor + prompt + run + result + hint + reveal-solution + navigation ✓ (T4); Cohere styling ✓ (T4 styles use tokens); CI cleanup ✓ (T5). FSRS scheduling and the dashboard are explicitly later plans.
- **Placeholder scan:** no TBDs; pure modules are fully implemented and tested; the browser smoke test is a real, scoped verification step, not a placeholder.
- **Type consistency:** `loadBank(base, fetchFn)` → `{meta, questions}`; `selectDaily(questions, completedThrough, dateStr, n)` → array; `getPyodide(onStatus)`, `runCode(pyodide, userCode, checkCode)` → `{passed, stdout, error}` via `shapeResult`; Practice consumes exactly these. Exercise fields (`starterCode`, `check`, `hint`, `solution`, `topic`, `chapter`, `difficulty`) match the bank schema from Plan 2.
```
