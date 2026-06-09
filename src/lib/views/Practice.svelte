<script>
  import { onMount } from 'svelte';
  import CodeEditor from '../components/CodeEditor.svelte';
  import SolutionDiff from '../components/SolutionDiff.svelte';
  import { loadBank } from '../bank/loadBank.js';
  import { buildDailySet } from '../srs/dailySet.js';
  import { getCurrentChapter } from '../settings.js';
  import { newCard, grade, ratingFor } from '../srs/scheduler.js';
  import { loadProgress, recordReview } from '../srs/progress.js';
  import { logReview } from '../srs/activity.js';
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
  let submittedCode = $state('');
  let showCompare = $state(false);

  const today = () => new Date();
  const current = $derived(exercises[index]);

  onMount(async () => {
    try {
      const { meta, questions } = await loadBank(import.meta.env.BASE_URL);
      const progress = loadProgress();
      const set = buildDailySet(questions, getCurrentChapter(meta.completedThrough), progress, today(), 5);
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
    showCompare = false; submittedCode = '';
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
    logReview(new Date().toISOString().slice(0, 10));
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
    if (running) return;
    running = true; result = null;
    try {
      const pyodide = await getPyodide((s) => (status = s));
      result = await runCode(pyodide, code, current.check);
      if (result.passed) submittedCode = code;
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

    <CodeEditor bind:value={code} onRun={run} />

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
        {#if result.error}<pre>{result.error}</pre>{/if}
        {#if result.stdout}<pre class="stdout">{result.stdout}</pre>{/if}
      </div>
      {#if result.passed}
        <button class="btn-secondary" onclick={() => (showCompare = !showCompare)}>
          {showCompare ? 'Hide comparison' : 'Compare with model solution'}
        </button>
        {#if showCompare}
          <SolutionDiff userCode={submittedCode} solution={current.solution} />
        {/if}
      {/if}
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
