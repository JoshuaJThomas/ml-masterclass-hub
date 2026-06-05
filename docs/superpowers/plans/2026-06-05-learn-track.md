# Learn Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A "Learn" tab: markdown lesson on the left, a tailored apply exercise (existing runner) on the right, feeding FSRS. Lessons for chapters 1–8.

**Tech Stack:** Svelte 5, Vitest, `marked` (markdown), Pyodide (reused), Python (content verification).

---

## Task 1: Markdown renderer + loadLessons + validator

**Files:** Create `src/lib/components/Markdown.svelte`, `src/lib/lessons/loadLessons.js` (+ test), `scripts/validate-lessons.js` (+ test). Modify `package.json` (marked).

- [ ] **Step 1: Install** — `npm install marked`

- [ ] **Step 2: `src/lib/components/Markdown.svelte`:**
```svelte
<script>
  import { marked } from 'marked';
  let { source = '' } = $props();
  const html = $derived(marked.parse(source ?? '', { async: false }));
</script>

<div class="md">{@html html}</div>

<style>
  .md :global(h1) { font-size: 28px; line-height: 1.2; margin: 0 0 var(--space-md); }
  .md :global(h2) { font-size: 20px; margin: var(--space-xl) 0 var(--space-sm); }
  .md :global(h3) { font-size: 16px; margin: var(--space-lg) 0 var(--space-xs); }
  .md :global(p), .md :global(li) { font-size: 15px; line-height: 1.6; color: var(--color-ink); }
  .md :global(code) { font-family: var(--font-mono); font-size: 13px; background: var(--color-soft-stone); padding: 1px 5px; border-radius: var(--radius-xs); }
  .md :global(pre) { background: var(--color-primary); color: var(--color-on-dark); padding: var(--space-md) var(--space-lg); border-radius: var(--radius-sm); overflow-x: auto; }
  .md :global(pre code) { background: none; color: inherit; padding: 0; }
  .md :global(strong) { font-weight: 600; }
</style>
```

- [ ] **Step 3: loadLessons test** — `src/lib/lessons/loadLessons.test.js`:
```js
import { describe, it, expect, vi } from 'vitest';
import { loadLessons } from './loadLessons.js';
describe('loadLessons', () => {
  it('fetches lessons.json under base', async () => {
    const data = [{ id: 'lesson-ch01-01' }];
    const f = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(data) }));
    expect(await loadLessons('/b/', f)).toEqual(data);
    expect(f).toHaveBeenCalledWith('/b/bank/lessons.json');
  });
  it('throws on a bad response', async () => {
    const f = vi.fn(() => Promise.resolve({ ok: false, status: 404 }));
    await expect(loadLessons('/b/', f)).rejects.toThrow(/lesson/i);
  });
});
```

- [ ] **Step 4: `src/lib/lessons/loadLessons.js`:**
```js
export async function loadLessons(base, fetchFn = fetch) {
  const res = await fetchFn(`${base}bank/lessons.json`);
  if (!res.ok) throw new Error(`Failed to load lessons (status ${res.status})`);
  return res.json();
}
```

- [ ] **Step 5: `scripts/validate-lessons.js`:**
```js
const DIFF = ['easy', 'medium', 'hard'];
const NONEMPTY = ['title', 'topic', 'content', 'prompt', 'check', 'solution'];

export function validateLessons(lessons) {
  const errors = [];
  if (!Array.isArray(lessons)) return { valid: false, errors: ['lessons must be an array'] };
  const seen = new Set();
  for (const l of lessons) {
    const where = l?.id ? `[${l.id}]` : '[<no id>]';
    if (typeof l?.id !== 'string' || !/^lesson-ch\d{2}-\d{2}$/.test(l.id)) errors.push(`${where} id must match lesson-ch<NN>-<NN>`);
    if (seen.has(l.id)) errors.push(`${where} duplicate id`);
    seen.add(l.id);
    if (!Number.isInteger(l.chapter) || l.chapter < 1) errors.push(`${where} chapter must be int >= 1`);
    if (!Number.isInteger(l.order)) errors.push(`${where} order must be an integer`);
    for (const f of NONEMPTY) if (typeof l[f] !== 'string' || !l[f].trim()) errors.push(`${where} ${f} required`);
    if (typeof l.starterCode !== 'string') errors.push(`${where} starterCode must be a string`);
    if (typeof l.hint !== 'string') errors.push(`${where} hint must be a string`);
    if (!DIFF.includes(l.difficulty)) errors.push(`${where} difficulty invalid`);
  }
  return { valid: errors.length === 0, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import('node:fs');
  const lessons = JSON.parse(readFileSync('public/bank/lessons.json', 'utf8'));
  const { valid, errors } = validateLessons(lessons);
  if (!valid) { console.error('Lessons invalid:'); errors.forEach((e) => console.error('  - ' + e)); process.exit(1); }
  console.log(`Lessons valid: ${lessons.length} across chapters ${Math.min(...lessons.map((l) => l.chapter))}-${Math.max(...lessons.map((l) => l.chapter))}.`);
}
```
`scripts/validate-lessons.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { validateLessons } from './validate-lessons.js';
const good = { id: 'lesson-ch01-01', chapter: 1, order: 1, title: 'T', topic: 't', content: '# hi', prompt: 'p', starterCode: 'x=1', check: 'assert x==1', hint: 'h', solution: 'x=1', difficulty: 'easy' };
describe('validateLessons', () => {
  it('accepts a good lesson', () => expect(validateLessons([good]).valid).toBe(true));
  it('rejects a bad id', () => expect(validateLessons([{ ...good, id: 'x' }]).valid).toBe(false));
  it('rejects empty content', () => expect(validateLessons([{ ...good, content: '' }]).valid).toBe(false));
  it('rejects a duplicate id', () => expect(validateLessons([good, { ...good }]).valid).toBe(false));
});
```

- [ ] **Step 6: Run `npm test`** — loadLessons + validateLessons tests pass (validate-lessons CLI not yet run — no lessons.json).

- [ ] **Step 7: Commit**
```bash
git add src/lib/components/Markdown.svelte src/lib/lessons package.json package-lock.json scripts/validate-lessons.js scripts/validate-lessons.test.js
git commit -m "feat: markdown renderer, lessons loader, and lessons validator"
```

---

## Task 2: Lesson content (Gemini-drafted, Python-verified) + wire validator

**Files:** Create `public/bank/lessons.json`; modify `package.json`.

> Orchestrator-driven (controller + Gemini), not a code subagent. The validator + Python
> execution gate are the acceptance criteria.

- [ ] **Step 1: Draft via Gemini.** Use `agy --add-dir <repo>` to draft ~30+ lessons across
  chapters 1–8 in the schema (`id, chapter, order, topic, title, content (markdown teaching +
  worked examples), starterCode, check, hint, solution, difficulty`). Apply exercise must be
  self-contained (numpy/pandas/matplotlib only, embedded data), `check` = python asserts on
  the result with float tolerances. Write to a temp JSON.
- [ ] **Step 2: Verify every apply exercise.** For each lesson, exec `solution` then `check`
  in a fresh namespace (Python, numpy/pandas/matplotlib installed). DROP any that fail. Also
  drop any whose `content` is trivially short (< ~200 chars) — lessons must actually teach.
- [ ] **Step 3: Review + assemble.** Spot-check teaching quality on a sample; fix `order` so
  it's sequential within each chapter; write the kept lessons to `public/bank/lessons.json`.
- [ ] **Step 4: Wire validator into `package.json`:**
```json
    "validate-lessons": "node scripts/validate-lessons.js",
    "test": "vitest run && npm run validate-bank && npm run validate-sql-bank && npm run validate-lessons"
```
- [ ] **Step 5: Run `npm test`** — unit tests pass and all three validators print "valid".
- [ ] **Step 6: Commit**
```bash
git add public/bank/lessons.json package.json
git commit -m "content: lessons for chapters 1-8 (verified apply exercises)"
```

---

## Task 3: Learn view + nav wiring

**Files:** Create `src/lib/views/Learn.svelte`; modify `src/lib/components/Header.svelte`, `src/App.svelte`.

- [ ] **Step 1: Create `src/lib/views/Learn.svelte`:**
```svelte
<script>
  import { onMount } from 'svelte';
  import CodeEditor from '../components/CodeEditor.svelte';
  import Markdown from '../components/Markdown.svelte';
  import { loadLessons } from '../lessons/loadLessons.js';
  import { getPyodide, runCode } from '../runner/pyodideRunner.js';
  import { newCard, grade, ratingFor } from '../srs/scheduler.js';
  import { loadProgress, recordReview } from '../srs/progress.js';
  import { logReview } from '../srs/activity.js';

  let loading = $state(true);
  let loadError = $state('');
  let lessons = $state([]);
  let progress = $state({});
  let index = $state(0);
  let code = $state('');
  let showHint = $state(false);
  let showSolution = $state(false);
  let usedHelp = $state(false);
  let status = $state('');
  let running = $state(false);
  let result = $state(null);

  const current = $derived(lessons[index]);
  const done = (id) => !!progress[id];

  onMount(async () => {
    try {
      lessons = await loadLessons(import.meta.env.BASE_URL);
      lessons.sort((a, b) => a.chapter - b.chapter || a.order - b.order);
      progress = loadProgress();
      if (lessons.length) reset();
    } catch (e) { loadError = String(e.message || e); }
    finally { loading = false; }
  });

  function reset() {
    code = current?.starterCode ?? '';
    showHint = false; showSolution = false; usedHelp = false; result = null;
  }
  function select(i) { index = i; reset(); }
  function go(d) { index = Math.max(0, Math.min(lessons.length - 1, index + d)); reset(); }

  function markDone(passed) {
    const card = progress[current.id] ?? newCard();
    const next = grade(card, ratingFor({ passed, usedHelp }), new Date());
    recordReview(current.id, next);
    logReview(new Date().toISOString().slice(0, 10));
    progress = loadProgress();
  }
  function toggleHint() { showHint = !showHint; if (showHint) usedHelp = true; }
  function revealSolution() { showSolution = !showSolution; if (showSolution) usedHelp = true; }

  async function run() {
    running = true; result = null;
    try {
      const pyodide = await getPyodide((s) => (status = s));
      result = await runCode(pyodide, code, current.check);
      if (result.passed && !done(current.id)) markDone(true);
    } catch (e) { result = { passed: false, stdout: '', error: String(e.message || e) }; }
    finally { running = false; status = ''; }
  }
</script>

<section class="wrap">
  {#if loading}
    <p class="container mono-label" style="padding: var(--space-xxl) 0">LOADING…</p>
  {:else if loadError}
    <p class="container mono-label" style="padding: var(--space-xxl) 0; color: var(--color-error)">{loadError}</p>
  {:else if !lessons.length}
    <p class="container mono-label" style="padding: var(--space-xxl) 0">NO LESSONS YET</p>
  {:else}
    <aside class="toc">
      <p class="mono-label" style="color: var(--color-muted)">LESSONS</p>
      <ol>
        {#each lessons as l, i}
          <li>
            <button class:active={i === index} onclick={() => select(i)}>
              <span class="tick">{done(l.id) ? '✓' : '○'}</span>
              <span>{l.title}</span>
            </button>
          </li>
        {/each}
      </ol>
    </aside>

    <div class="lesson">
      <div class="head">
        <p class="mono-label" style="color: var(--color-deep-green)">CH {String(current.chapter).padStart(2, '0')} · LESSON {index + 1}/{lessons.length}</p>
        <div class="nav">
          <button class="btn-secondary" onclick={() => go(-1)} disabled={index === 0}>Prev</button>
          <button class="btn-secondary" onclick={() => go(1)} disabled={index === lessons.length - 1}>Next</button>
        </div>
      </div>
      <div class="split">
        <div class="teach"><Markdown source={current.content} /></div>
        <div class="apply">
          <p class="mono-label" style="color: var(--color-deep-green)">NOW TRY IT</p>
          <p class="body-large" style="color: var(--color-body-muted)">{current.prompt}</p>
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
              <strong>{result.passed ? '✓ Passed — lesson complete' : '✗ Not yet'}</strong>
              {#if result.error}<pre>{result.error}</pre>{/if}
              {#if result.stdout}<pre class="stdout">{result.stdout}</pre>{/if}
            </div>
          {/if}
          {#if showSolution}<details open class="sol"><summary class="mono-label">SOLUTION</summary><pre>{current.solution}</pre></details>{/if}
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  .wrap { display: flex; gap: var(--space-xl); max-width: 1280px; margin: 0 auto; padding: var(--space-xl); }
  .toc { flex: 0 0 220px; position: sticky; top: var(--space-xl); align-self: flex-start; max-height: 85vh; overflow-y: auto; }
  .toc ol { list-style: none; margin: var(--space-sm) 0 0; padding: 0; }
  .toc button { display: flex; gap: var(--space-sm); width: 100%; text-align: left; background: none; border: none; cursor: pointer; padding: 6px 8px; border-radius: var(--radius-xs); font-size: 13px; color: var(--color-body-muted); }
  .toc button.active { background: var(--color-pale-green); color: var(--color-ink); }
  .toc .tick { color: var(--color-deep-green); }
  .lesson { flex: 1; min-width: 0; }
  .head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-md); }
  .nav { display: flex; gap: var(--space-lg); }
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-xl); margin-top: var(--space-lg); }
  .teach { border-right: 1px solid var(--color-hairline); padding-right: var(--space-xl); }
  .actions { display: flex; gap: var(--space-lg); flex-wrap: wrap; margin-top: var(--space-md); align-items: center; }
  .hint { background: var(--color-pale-green); border-radius: var(--radius-sm); padding: var(--space-md); }
  .result { margin-top: var(--space-md); border-radius: var(--radius-sm); padding: var(--space-md); border: 1px solid var(--color-hairline); }
  .result.ok { background: var(--color-pale-green); }
  .result.bad { background: var(--color-pale-blue); }
  .result pre, .sol pre { font-family: var(--font-mono); font-size: 13px; white-space: pre-wrap; margin: var(--space-sm) 0 0; }
  .sol { margin-top: var(--space-md); }
  @media (max-width: 860px) {
    .wrap { flex-direction: column; }
    .toc { position: static; max-height: none; flex-basis: auto; }
    .split { grid-template-columns: 1fr; }
    .teach { border-right: none; border-bottom: 1px solid var(--color-hairline); padding-right: 0; padding-bottom: var(--space-lg); }
  }
</style>
```

- [ ] **Step 2: Add a Learn tab to `src/lib/components/Header.svelte`** — as the FIRST nav button (before Practice):
```svelte
      <button class:active={$view === 'learn'} onclick={() => view.set('learn')}>Learn</button>
```

- [ ] **Step 3: Wire into `src/App.svelte`** — add `import Learn from './lib/views/Learn.svelte';` and extend the conditional:
```svelte
  {#if $view === 'learn'}
    <Learn />
  {:else if $view === 'practice'}
    <Practice />
  {:else if $view === 'sql'}
    <Sql />
  {:else}
    <Progress />
  {/if}
```

- [ ] **Step 4: Verify** — `npm run build` (only the known CodeMirror chunk warning) and `npm test`.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: Learn tab — split lesson + apply, FSRS-graded"
```

---

## Task 4: Browser smoke test (post-merge)

- [ ] Open the Learn tab, confirm a lesson renders (markdown left + editor right), reveal the
  solution, run it, assert "lesson complete" and that the lesson's ✓ tick appears. Does not
  block the merge.

---

## Self-Review
- **Spec coverage:** Learn tab ✓ (T3); markdown lesson + apply split ✓ (T3); lessons data +
  validator ✓ (T1, T2); FSRS-graded completion ✓ (T3 markDone); content verified ✓ (T2). Nav
  wiring ✓ (T3).
- **Placeholder scan:** none; content is generated + gated by a real Python execution check.
- **Type consistency:** `loadLessons(base,fetch)→array`; lesson schema (`id,chapter,order,
  title,topic,content,prompt,starterCode,check,hint,solution,difficulty`) consistent across
  validator, generator, and Learn.svelte; `runCode`/`getPyodide`/FSRS APIs reused as-is;
  `lesson-` ids never collide with `ch-`/`sql-` cards in the shared progress store.
