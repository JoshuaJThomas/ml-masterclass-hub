<script>
  import { onMount } from 'svelte';
  import CodeEditor from '../components/CodeEditor.svelte';
  import { loadBank } from '../bank/loadBank.js';
  import { getPyodide, runCode } from '../runner/pyodideRunner.js';
  import { newCard, grade, ratingFor } from '../srs/scheduler.js';
  import { loadProgress, recordReview } from '../srs/progress.js';
  import { logReview } from '../srs/activity.js';

  let loading = $state(true);
  let loadError = $state('');
  let all = $state([]);
  let progress = $state({});
  let query = $state('');
  let diff = $state('all');
  let selected = $state(null);
  let code = $state('');
  let showHint = $state(false);
  let showSolution = $state(false);
  let usedHelp = $state(false);
  let running = $state(false);
  let status = $state('');
  let result = $state(null);
  let graded = $state(new Set());

  const done = (id) => !!progress[id];
  const filtered = $derived(
    all.filter((q) =>
      (diff === 'all' || q.difficulty === diff) &&
      (!query || (q.topic + ' ' + q.prompt + ' ' + q.id).toLowerCase().includes(query.toLowerCase()))
    )
  );
  const groups = $derived(() => {
    const m = new Map();
    for (const q of filtered) {
      if (!m.has(q.chapter)) m.set(q.chapter, []);
      m.get(q.chapter).push(q);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  });

  onMount(async () => {
    try {
      const { questions } = await loadBank(import.meta.env.BASE_URL);
      all = questions;
      progress = loadProgress();
    } catch (e) { loadError = String(e.message || e); }
    finally { loading = false; }
  });

  function open(q) {
    selected = q; code = q.starterCode ?? '';
    showHint = false; showSolution = false; usedHelp = false; result = null;
  }
  function close() { selected = null; result = null; }
  function gradeOnce(passed) {
    if (!selected || graded.has(selected.id)) return;
    graded.add(selected.id);
    const p = loadProgress();
    const card = p[selected.id] ?? newCard();
    recordReview(selected.id, grade(card, ratingFor({ passed, usedHelp }), new Date()));
    logReview(new Date().toISOString().slice(0, 10));
    progress = loadProgress();
  }
  function toggleHint() { showHint = !showHint; if (showHint) usedHelp = true; }
  function revealSolution() { showSolution = !showSolution; if (showSolution) usedHelp = true; }
  async function run() {
    running = true; result = null;
    try {
      const py = await getPyodide((s) => (status = s));
      result = await runCode(py, code, selected.check);
      if (result.passed) gradeOnce(true);
    } catch (e) { result = { passed: false, error: String(e.message || e), stdout: '' }; }
    finally { running = false; status = ''; }
  }
</script>

<section class="container pad">
  {#if loading}
    <p class="mono-label">LOADING…</p>
  {:else if loadError}
    <p class="mono-label" style="color: var(--color-error)">{loadError}</p>
  {:else if selected}
    <button class="btn-secondary" onclick={close}>← Back to library</button>
    <p class="mono-label" style="color: var(--color-muted); margin-top: var(--space-md)">CH {String(selected.chapter).padStart(2, '0')} · {selected.difficulty}</p>
    <h1 class="heading-feature">{selected.topic}</h1>
    <p class="body-large" style="color: var(--color-body-muted); max-width: 720px;">{selected.prompt}</p>
    <CodeEditor bind:value={code} />
    <div class="actions">
      <button class="btn-primary" onclick={run} disabled={running}>{running ? 'Running…' : 'Run'}</button>
      <button class="btn-secondary" onclick={toggleHint}>{showHint ? 'Hide hint' : 'Show hint'}</button>
      <button class="btn-secondary" onclick={revealSolution}>{showSolution ? 'Hide solution' : 'Reveal solution'}</button>
    </div>
    {#if status}<p class="micro">{status}</p>{/if}
    {#if showHint}<p class="hint">💡 {selected.hint}</p>{/if}
    {#if result}
      <div class="result {result.passed ? 'ok' : 'bad'}">
        <strong>{result.passed ? '✓ Passed' : '✗ Not yet'}</strong>
        {#if result.error}<pre>{result.error}</pre>{/if}
        {#if result.stdout}<pre>{result.stdout}</pre>{/if}
      </div>
    {/if}
    {#if showSolution}<details open class="sol"><summary class="mono-label">SOLUTION</summary><pre>{selected.solution}</pre></details>{/if}
  {:else}
    <p class="mono-label" style="color: var(--color-deep-green)">LIBRARY · {filtered.length} EXERCISES</p>
    <div class="filters">
      <input class="search" placeholder="Search topics…" bind:value={query} />
      <select bind:value={diff}>
        <option value="all">All</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
      </select>
    </div>
    {#each groups() as [chapter, items]}
      <h2 class="heading-feature ch">Chapter {chapter}</h2>
      <ul class="list">
        {#each items as q}
          <li>
            <button onclick={() => open(q)}>
              <span class="tick">{done(q.id) ? '✓' : '○'}</span>
              <span class="topic">{q.topic}</span>
              <span class="diff">{q.difficulty}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/each}
  {/if}
</section>

<style>
  .pad { padding: var(--space-xxl) 0 var(--space-section); }
  .filters { display: flex; gap: var(--space-md); margin: var(--space-lg) 0; flex-wrap: wrap; }
  .search { flex: 1; min-width: 200px; font-family: var(--font-body); font-size: 15px; padding: 8px 12px; border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); }
  .filters select { font-family: var(--font-mono); padding: 4px 10px; border: 1px solid var(--color-hairline); border-radius: var(--radius-xs); }
  .ch { font-size: 18px; margin: var(--space-xl) 0 var(--space-sm); }
  .list { list-style: none; margin: 0; padding: 0; }
  .list button { display: flex; align-items: center; gap: var(--space-md); width: 100%; text-align: left; background: none; border: none; border-bottom: 1px solid var(--color-hairline); cursor: pointer; padding: 10px 6px; font-size: 14px; color: var(--color-ink); }
  .list button:hover { background: var(--color-pale-green); }
  .tick { color: var(--color-deep-green); width: 14px; }
  .topic { flex: 1; }
  .diff { font-family: var(--font-mono); font-size: 12px; color: var(--color-muted); text-transform: uppercase; }
  .actions { display: flex; gap: var(--space-xl); margin-top: var(--space-lg); flex-wrap: wrap; align-items: center; }
  .hint { background: var(--color-pale-green); border-radius: var(--radius-sm); padding: var(--space-md); max-width: 720px; }
  .result { margin-top: var(--space-lg); border-radius: var(--radius-sm); padding: var(--space-md) var(--space-lg); border: 1px solid var(--color-hairline); }
  .result.ok { background: var(--color-pale-green); }
  .result.bad { background: var(--color-pale-blue); }
  .result pre, .sol pre { font-family: var(--font-mono); font-size: 13px; white-space: pre-wrap; margin: var(--space-sm) 0 0; }
  .sol { margin-top: var(--space-md); }
  h1 { margin: var(--space-sm) 0; }
</style>
