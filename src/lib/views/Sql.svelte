<script>
  import { onMount } from 'svelte';
  import CodeEditor from '../components/CodeEditor.svelte';
  import ResultTable from '../components/ResultTable.svelte';
  import { loadSqlBank } from '../sql/loadSqlBank.js';
  import { getDb, runQuery, compareResults } from '../sql/sqlRunner.js';
  import { buildDailySet } from '../srs/dailySet.js';
  import { newCard, grade, ratingFor } from '../srs/scheduler.js';
  import { loadProgress, recordReview } from '../srs/progress.js';
  import { logReview } from '../srs/activity.js';

  let loading = $state(true);
  let loadError = $state('');
  let exercises = $state([]);
  let counts = $state({ due: 0, fresh: 0 });
  let index = $state(0);
  let query = $state('');
  let showHint = $state(false);
  let showSolution = $state(false);
  let usedHelp = $state(false);
  let graded = $state(new Set());
  let status = $state('');
  let running = $state(false);
  let actual = $state(null);
  let result = $state(null);

  const current = $derived(exercises[index]);

  onMount(async () => {
    try {
      const bank = await loadSqlBank(import.meta.env.BASE_URL);
      const withChapter = bank.map((q) => ({ ...q, chapter: q.tier }));
      const set = buildDailySet(withChapter, 999, loadProgress(), new Date(), 5);
      exercises = set.all;
      counts = { due: set.due.length, fresh: set.fresh.length };
      if (exercises.length) reset();
    } catch (e) { loadError = String(e.message || e); }
    finally { loading = false; }
  });

  function reset() {
    query = current?.starterQuery ?? '';
    showHint = false; showSolution = false; usedHelp = false; actual = null; result = null;
  }
  function go(d) { index = Math.max(0, Math.min(exercises.length - 1, index + d)); reset(); }

  function gradeOnce(passed) {
    if (!current || graded.has(current.id)) return;
    graded.add(current.id);
    const p = loadProgress();
    const card = p[current.id] ?? newCard();
    recordReview(current.id, grade(card, ratingFor({ passed, usedHelp }), new Date()));
    logReview(new Date().toISOString().slice(0, 10));
  }
  function toggleHint() { showHint = !showHint; if (showHint) usedHelp = true; }
  function revealSolution() { showSolution = !showSolution; if (showSolution) { usedHelp = true; gradeOnce(false); } }

  async function run() {
    if (running) return;
    running = true; actual = null; result = null;
    try {
      const db = await getDb((s) => (status = s));
      try { actual = runQuery(db, query); }
      catch (e) { actual = { error: String(e.message || e) }; }
      result = compareResults(current.expected, actual);
      if (result.passed) gradeOnce(true);
    } finally { running = false; status = ''; }
  }
</script>

<section class="container pad">
  {#if loading}
    <p class="mono-label">LOADING…</p>
  {:else if loadError}
    <p class="mono-label" style="color: var(--color-error)">COULD NOT LOAD SQL EXERCISES</p>
    <p class="body-large">{loadError}</p>
  {:else if !exercises.length}
    <p class="mono-label">ALL CAUGHT UP</p>
    <p class="body-large">No SQL exercises are due right now.</p>
  {:else}
    <div class="head">
      <p class="mono-label" style="color: var(--color-deep-green)">SQL · {index + 1}/{exercises.length} · {counts.due} DUE · {counts.fresh} NEW</p>
      <div class="nav">
        <button class="btn-secondary" onclick={() => go(-1)} disabled={index === 0}>Prev</button>
        <button class="btn-secondary" onclick={() => go(1)} disabled={index === exercises.length - 1}>Next</button>
      </div>
    </div>
    <p class="mono-label" style="color: var(--color-muted)">TIER {current.tier} · {current.difficulty}</p>
    <h1 class="heading-feature">{current.topic}</h1>
    <p class="body-large" style="color: var(--color-body-muted); max-width: 720px;">{current.prompt}</p>

    <CodeEditor bind:value={query} lang="sql" onRun={run} />

    <div class="actions">
      <button class="btn-primary" onclick={run} disabled={running} title="Run (Ctrl+Enter)">{running ? 'Running…' : 'Run'}</button>
      <button class="btn-secondary" onclick={toggleHint}>{showHint ? 'Hide hint' : 'Show hint'}</button>
      <button class="btn-secondary" onclick={revealSolution}>{showSolution ? 'Hide solution' : 'Reveal solution'}</button>
    </div>
    {#if status}<p class="micro">{status}</p>{/if}
    {#if showHint}<p class="hint">💡 {current.hint}</p>{/if}

    {#if result}
      <div class="result {result.passed ? 'ok' : 'bad'}">
        <strong>{result.passed ? '✓ Passed' : '✗ Not yet'}</strong>
        {#if !result.passed && result.reason}<span class="micro"> — {result.reason}</span>{/if}
      </div>
      {#if actual && !actual.error}
        <ResultTable columns={actual.columns} rows={actual.rows} caption="YOUR RESULT" />
      {:else if actual?.error}
        <pre class="err">{actual.error}</pre>
      {/if}
      {#if result && !result.passed}
        <ResultTable columns={current.expected.columns} rows={current.expected.rows} caption="EXPECTED" />
      {/if}
    {/if}

    {#if showSolution}
      <details open class="solution"><summary class="mono-label">SOLUTION</summary><pre>{current.solution}</pre></details>
    {/if}
  {/if}
</section>

<style>
  .pad { padding: var(--space-xxl) 0 var(--space-section); }
  .head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-md); }
  .nav { display: flex; gap: var(--space-lg); }
  .actions { display: flex; gap: var(--space-xl); align-items: center; margin-top: var(--space-lg); flex-wrap: wrap; }
  .hint { background: var(--color-pale-green); border-radius: var(--radius-sm); padding: var(--space-md) var(--space-lg); max-width: 720px; }
  .result { margin-top: var(--space-lg); border-radius: var(--radius-sm); padding: var(--space-md) var(--space-lg); border: 1px solid var(--color-hairline); }
  .result.ok { background: var(--color-pale-green); }
  .result.bad { background: var(--color-pale-blue); }
  .err { font-family: var(--font-mono); font-size: 13px; color: var(--color-error); white-space: pre-wrap; }
  .solution { margin-top: var(--space-lg); border-top: 1px solid var(--color-hairline); padding-top: var(--space-lg); }
  .solution pre { font-family: var(--font-mono); font-size: 13px; white-space: pre-wrap; }
  h1 { margin: var(--space-sm) 0; }
</style>
