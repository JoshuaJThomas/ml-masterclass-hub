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
