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
  import { getPyodide, runGraded, runScratch, runExpected } from '../runner/pyodideRunner.js';
  import { burstConfetti } from '../confetti.js';

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
  let trying = $state(false);
  let result = $state(null);
  let scratch = $state(null);
  let expected = $state(null);
  let submittedCode = $state('');
  let showCompare = $state(false);

  const today = () => new Date();
  const current = $derived(exercises[index]);
  const trunc = (s, n = 240) => (s == null ? s : s.length > n ? s.slice(0, n) + '…' : s);

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
    showHint = false; showSolution = false; usedHelp = false;
    result = null; scratch = null; expected = null;
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

  // Peeking is for learning — it no longer marks the card failed.
  function revealSolution() {
    showSolution = !showSolution;
    if (showSolution) usedHelp = true;
  }
  function toggleHint() {
    showHint = !showHint;
    if (showHint) usedHelp = true;
  }

  // Graded run: check the answer, show what you got vs what was expected.
  async function run() {
    if (running || trying) return;
    running = true; result = null; scratch = null; expected = null;
    try {
      const pyodide = await getPyodide((s) => (status = s));
      const r = await runGraded(pyodide, code, current.check);
      result = r;
      if (r.passed) {
        submittedCode = code;
        gradeOnce(true);
        burstConfetti();
      } else if (r.error === 'assert') {
        expected = await runExpected(pyodide, current.solution);
      }
    } catch (e) {
      result = { passed: false, stdout: '', error: String(e.message || e), value: null };
    } finally {
      running = false; status = '';
    }
  }

  // No-grade run: just execute and show output, so you can experiment freely.
  async function tryIt() {
    if (running || trying) return;
    trying = true; scratch = null; result = null;
    try {
      const pyodide = await getPyodide((s) => (status = s));
      scratch = await runScratch(pyodide, code);
    } catch (e) {
      scratch = { error: String(e.message || e), value: null, stdout: '' };
    } finally {
      trying = false; status = '';
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
      <button class="btn-primary" onclick={run} disabled={running || trying} title="Run (Ctrl+Enter)">{running ? 'Checking…' : 'Run ▸'}</button>
      <button class="btn-secondary" onclick={tryIt} disabled={running || trying}>{trying ? 'Running…' : 'Try it'}</button>
      <button class="btn-chip" onclick={toggleHint}>💡 {showHint ? 'Hide hint' : 'Hint'}</button>
      <button class="btn-chip" onclick={revealSolution}>👀 {showSolution ? 'Hide solution' : 'Solution'}</button>
    </div>

    {#if status}<p class="micro">{status}</p>{/if}
    {#if showHint}<p class="hint">💡 {current.hint}</p>{/if}

    {#if scratch}
      <div class="scratch">
        <span class="tag">OUTPUT</span>
        {#if scratch.error}
          <pre class="err-text">{scratch.error}</pre>
        {:else}
          {#if scratch.stdout}<pre>{scratch.stdout}</pre>{/if}
          {#if scratch.value != null}<p class="val"><code>result → {trunc(scratch.value)}</code></p>{/if}
          {#if !scratch.stdout && scratch.value == null}<p class="micro">Ran fine — no output, and no <code>result</code> set.</p>{/if}
        {/if}
      </div>
    {/if}

    {#if result}
      {#if result.passed}
        <div class="result ok">
          <strong>✓ Nice — solved it!</strong>
          {#if result.stdout}<pre class="stdout">{result.stdout}</pre>{/if}
        </div>
        <button class="btn-chip" onclick={() => (showCompare = !showCompare)}>
          {showCompare ? 'Hide comparison' : 'Compare with model solution'}
        </button>
        {#if showCompare}
          <SolutionDiff userCode={submittedCode} solution={current.solution} />
        {/if}
      {:else if result.error === 'assert'}
        <div class="result bad">
          <strong>So close 👀</strong>
          {#if result.value != null || expected != null}
            <div class="diff">
              {#if result.value != null}<div class="row"><span class="k">You got</span><code class="got">{trunc(result.value)}</code></div>{/if}
              {#if expected != null}<div class="row"><span class="k">Expected</span><code class="exp">{trunc(expected)}</code></div>{/if}
            </div>
            <p class="nudge">Spot the difference, tweak it, and run again — or peek a hint.</p>
          {:else}
            <p class="nudge">Your code ran, but the check didn’t pass yet. Try a hint, or hit “Try it” to see your output.</p>
          {/if}
          {#if result.stdout}<pre class="stdout">{result.stdout}</pre>{/if}
        </div>
      {:else}
        <div class="result err">
          <strong>Your code hit a snag</strong>
          <pre class="err-text">{result.error}</pre>
          <p class="nudge">Read the last line — it usually points at what to fix. Then run again.</p>
          {#if result.stdout}<pre class="stdout">{result.stdout}</pre>{/if}
        </div>
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
  .nav { display: flex; gap: var(--space-md); }
  .actions { display: flex; gap: var(--space-md); align-items: center; margin-top: var(--space-lg); flex-wrap: wrap; }
  .hint { background: var(--color-pale-green); border-radius: var(--radius-md); padding: var(--space-md) var(--space-lg); max-width: 720px; margin-top: var(--space-md); }

  .scratch { margin-top: var(--space-lg); border-radius: var(--radius-md); padding: var(--space-lg); background: var(--color-surface-2); max-width: 720px; }
  .scratch .tag { font-family: var(--font-mono); font-size: 11px; letter-spacing: .28px; color: var(--color-muted); }
  .scratch .val code { font-family: var(--font-mono); font-size: 13px; }

  .result { margin-top: var(--space-lg); border-radius: var(--radius-md); padding: var(--space-lg); border: 1px solid var(--color-card-border); max-width: 720px; box-shadow: var(--shadow-sm); }
  .result.ok  { background: var(--color-win-soft); border-color: transparent; }
  .result.bad { background: #fff6ec; border-color: transparent; }
  .result.err { background: var(--color-pale-blue); border-color: transparent; }
  .result strong { display: block; font-family: var(--font-display); font-size: 18px; }
  .result pre, .solution pre { font-family: var(--font-mono); font-size: 13px; white-space: pre-wrap; word-break: break-word; margin: var(--space-sm) 0 0; }
  .result .stdout { color: var(--color-body-muted); }
  .err-text { color: var(--color-error); font-family: var(--font-mono); font-size: 13px; white-space: pre-wrap; word-break: break-word; margin: var(--space-sm) 0 0; }

  .diff { display: flex; flex-direction: column; gap: var(--space-xs); margin-top: var(--space-md); }
  .diff .row { display: flex; gap: var(--space-md); align-items: baseline; flex-wrap: wrap; }
  .diff .k { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: .28px; color: var(--color-muted); min-width: 72px; }
  .diff code { font-family: var(--font-mono); font-size: 13px; padding: 2px 8px; border-radius: var(--radius-xs); word-break: break-word; }
  .diff .got { background: #ffe2d6; color: #8a2c12; }
  .diff .exp { background: var(--color-win-soft); color: #155e3f; }
  .nudge { margin: var(--space-md) 0 0; color: var(--color-body-muted); }

  .solution { margin-top: var(--space-lg); border-top: 1px solid var(--color-hairline); padding-top: var(--space-lg); max-width: 720px; }
  h1 { margin: var(--space-sm) 0 var(--space-sm); }
</style>
