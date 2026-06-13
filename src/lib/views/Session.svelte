<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import CodeEditor from '../components/CodeEditor.svelte';
  import SolutionDiff from '../components/SolutionDiff.svelte';
  import { session, endSession } from '../stores/view.js';
  import { newCard, grade, ratingFor } from '../srs/scheduler.js';
  import { loadProgress, recordReview } from '../srs/progress.js';
  import { logReview } from '../srs/activity.js';
  import { getPyodide, runGraded, runScratch, runExpected } from '../runner/pyodideRunner.js';

  const data = $session.data;
  const graded = data.graded;

  // phases: run (graded items) → cooldown → done
  let phase = $state('run');
  let index = $state(0);
  let solvedCount = $state(0);

  let code = $state('');
  let showHint = $state(false);
  let showSolution = $state(false);
  let usedHelp = $state(false);
  let gradedIds = $state(new Set());
  let status = $state('');
  let running = $state(false);
  let trying = $state(false);
  let result = $state(null);
  let scratch = $state(null);
  let expected = $state(null);
  let submittedCode = $state('');
  let showCompare = $state(false);
  let coolNote = $state('');
  let kbInset = $state(0);

  const current = $derived(graded[index]);
  const isCore = $derived(data.core && current && current.id === data.core.id);
  const total = graded.length;
  const trunc = (s, n = 240) => (s == null ? s : s.length > n ? s.slice(0, n) + '…' : s);

  // Keyboard handling (DIRECTION.md §3, the #1 detail): keep the action bar ABOVE the
  // open IME via visualViewport. interactive-widget=resizes-content covers Chrome/Android;
  // this fallback lifts the bar on browsers that don't resize the layout viewport (iOS).
  function onViewport() {
    const vv = window.visualViewport;
    if (!vv) return;
    kbInset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
  }

  onMount(() => {
    resetForCurrent();
    const vv = window.visualViewport;
    if (vv) { vv.addEventListener('resize', onViewport); vv.addEventListener('scroll', onViewport); }
  });
  onDestroy(() => {
    const vv = window.visualViewport;
    if (vv) { vv.removeEventListener('resize', onViewport); vv.removeEventListener('scroll', onViewport); }
  });

  function resetForCurrent() {
    code = current?.starterCode ?? '';
    showHint = false; showSolution = false; usedHelp = false;
    result = null; scratch = null; expected = null;
    showCompare = false; submittedCode = '';
  }

  function gradeOnce(passed) {
    if (!current || gradedIds.has(current.id)) return;
    gradedIds.add(current.id);
    const progress = loadProgress();
    const card = progress[current.id] ?? newCard();
    const next = grade(card, ratingFor({ passed, usedHelp }), new Date());
    recordReview(current.id, next);
    logReview(new Date().toISOString().slice(0, 10));
    if (passed) solvedCount += 1;
  }

  async function next() {
    if (index < total - 1) {
      index += 1;
      await tick();
      resetForCurrent();
    } else {
      phase = 'cooldown';
    }
  }

  // Mobile escape hatch (DIRECTION.md §1): defer the core to desktop without losing "done".
  function deferCore() { next(); }

  async function run() {
    if (running || trying) return;
    running = true; result = null; scratch = null; expected = null;
    try {
      const pyodide = await getPyodide((s) => (status = s));
      const r = await runGraded(pyodide, code, current.check);
      result = r;
      if (r.passed) { submittedCode = code; gradeOnce(true); }
      else if (r.error === 'assert') { expected = await runExpected(pyodide, current.solution); }
    } catch (e) {
      result = { passed: false, stdout: '', error: String(e.message || e), value: null };
    } finally {
      running = false; status = '';
    }
  }

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

  function toggleHint() { showHint = !showHint; if (showHint) usedHelp = true; }
  function revealSolution() { showSolution = !showSolution; if (showSolution) usedHelp = true; }
</script>

<div class="session" style="--kb:{kbInset}px">
  {#if phase === 'run'}
    <header class="shead">
      <button class="x" onclick={endSession} aria-label="Close session">✕</button>
      <div class="dots" aria-hidden="true">
        {#each graded as _, i}<span class="dot" class:on={i <= index} class:cur={i === index}></span>{/each}
        <span class="dot" class:on={false}></span>
      </div>
      <span class="kicker">{isCore ? 'Core task' : 'Warm-up'}</span>
    </header>

    <div class="scroll">
      <p class="mono-label">Ch {String(current.chapter).padStart(2, '0')} · {current.difficulty}</p>
      <h1 class="heading-card topic">{current.topic}</h1>
      <p class="body-large prompt">{current.prompt}</p>

      <CodeEditor bind:value={code} onRun={run} />

      {#if showHint}<p class="hint">{current.hint}</p>{/if}

      {#if scratch}
        <div class="panel">
          <span class="tag">Output</span>
          {#if scratch.error}<pre class="err">{scratch.error}</pre>
          {:else}
            {#if scratch.stdout}<pre>{scratch.stdout}</pre>{/if}
            {#if scratch.value != null}<p class="val"><code>result → {trunc(scratch.value)}</code></p>{/if}
            {#if !scratch.stdout && scratch.value == null}<p class="micro">Ran fine — no output, no <code>result</code> set.</p>{/if}
          {/if}
        </div>
      {/if}

      {#if result}
        {#if result.passed}
          <div class="panel ok">
            <strong>Solved it</strong>
            {#if result.stdout}<pre>{result.stdout}</pre>{/if}
            <button class="btn-chip" onclick={() => (showCompare = !showCompare)}>{showCompare ? 'Hide model solution' : 'Compare with model solution'}</button>
            {#if showCompare}<SolutionDiff userCode={submittedCode} solution={current.solution} />{/if}
          </div>
        {:else if result.error === 'assert'}
          <div class="panel bad">
            <strong>So close</strong>
            <div class="diff">
              {#if result.value != null}<div class="row"><span class="k">You got</span><code class="got">{trunc(result.value)}</code></div>{/if}
              {#if expected != null}<div class="row"><span class="k">Expected</span><code class="exp">{trunc(expected)}</code></div>{/if}
            </div>
            <p class="nudge">Spot the difference and run again — or peek a hint.</p>
          </div>
        {:else}
          <div class="panel err">
            <strong>Your code hit a snag</strong>
            <pre class="err">{result.error}</pre>
            <p class="nudge">Read the last line — it usually points at the fix.</p>
          </div>
        {/if}
      {/if}

      {#if showSolution}
        <details open class="solution"><summary class="mono-label">Model solution</summary><pre>{current.solution}</pre></details>
      {/if}

      {#if status}<p class="micro status">{status}</p>{/if}
    </div>

    <div class="actionbar">
      <div class="abrow">
        <button class="btn-primary run" onclick={run} disabled={running || trying} title="Run (Ctrl+Enter)">{running ? 'Checking…' : 'Run'}</button>
        <button class="btn-secondary" onclick={tryIt} disabled={running || trying}>{trying ? '…' : 'Try it'}</button>
        <button class="btn-chip" onclick={toggleHint}>{showHint ? 'Hide hint' : 'Hint'}</button>
        <button class="btn-chip" onclick={revealSolution}>{showSolution ? 'Hide' : 'Solution'}</button>
        {#if result?.passed}
          <button class="btn-primary nextbtn" onclick={next}>{index < total - 1 ? 'Next' : 'Finish'}</button>
        {:else}
          <button class="btn-chip skip" onclick={isCore ? deferCore : next}>{isCore ? 'Finish on desktop →' : 'Skip'}</button>
        {/if}
      </div>
    </div>

  {:else if phase === 'cooldown'}
    <header class="shead">
      <button class="x" onclick={endSession} aria-label="Close session">✕</button>
      <span class="kicker">Cool-down</span>
    </header>
    <div class="scroll">
      <h1 class="heading-card topic">{data.cooldown.prompt}</h1>
      <p class="body-large prompt muted">Ungraded — just for you. Putting it in words makes it stick.</p>
      <textarea class="cool" rows="4" bind:value={coolNote} placeholder="In one sentence…"></textarea>
      {#if data.core}
        <details class="solution"><summary class="mono-label">See the model solution for the core task</summary><pre>{data.core.solution}</pre></details>
      {/if}
    </div>
    <div class="actionbar"><div class="abrow"><button class="btn-primary run" onclick={() => (phase = 'done')}>Done</button></div></div>

  {:else}
    <div class="scroll center">
      <div class="complete">
        <div class="checkring" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>
        </div>
        <h1 class="heading-section">Done for today</h1>
        <p class="body-large muted">{solvedCount} solved this session. See you tomorrow.</p>
        <button class="btn-primary" onclick={endSession}>Back to Today</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .session {
    position: fixed; inset: 0; z-index: 100;
    display: flex; flex-direction: column;
    background: var(--color-bg); color: var(--color-text);
  }
  .shead {
    display: flex; align-items: center; gap: var(--space-3);
    padding: calc(env(safe-area-inset-top) + 10px) var(--space-4) 10px;
    border-bottom: 1px solid var(--color-border);
  }
  .x { background: none; border: none; color: var(--color-text-muted); font-size: 16px; cursor: pointer; padding: 4px 8px; border-radius: var(--radius-control); }
  .x:hover { color: var(--color-text); }
  .kicker { margin-left: auto; font-size: var(--size-xs); font-weight: 600; color: var(--color-text-muted); }
  .dots { display: flex; gap: 6px; align-items: center; }
  .dot { width: 7px; height: 7px; border-radius: var(--radius-dot); background: var(--color-border); transition: background .15s ease; }
  .dot.on { background: var(--color-text-muted); }
  .dot.cur { background: var(--color-accent); }

  .scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
    padding: var(--space-4) var(--space-4) calc(120px + var(--kb)); max-width: 760px; margin: 0 auto; width: 100%; }
  .scroll.center { display: flex; align-items: center; justify-content: center; padding-bottom: var(--space-8); }

  .topic { margin: var(--space-1) 0 var(--space-2); }
  .prompt { color: var(--color-text-muted); margin: 0 0 var(--space-4); }
  .muted { color: var(--color-text-muted); }
  .mono-label { margin: 0; }

  .hint { background: var(--color-raised-2); border-radius: var(--radius-control); padding: var(--space-3); margin-top: var(--space-3); }
  .panel { margin-top: var(--space-4); border-radius: var(--radius-control); padding: var(--space-4); background: var(--color-raised); border: 1px solid var(--color-border); }
  .panel.ok { border-color: color-mix(in srgb, var(--color-green) 50%, var(--color-border)); }
  .panel.bad, .panel.err { border-color: color-mix(in srgb, var(--color-red) 40%, var(--color-border)); }
  .panel strong { display: block; margin-bottom: var(--space-2); }
  .panel pre, .solution pre { font-family: var(--font-mono); font-size: 13px; white-space: pre-wrap; word-break: break-word; margin: var(--space-2) 0 0; color: var(--color-text-muted); }
  .panel .err { color: var(--color-red); }
  .diff { display: flex; flex-direction: column; gap: var(--space-1); }
  .diff .row { display: flex; gap: var(--space-3); align-items: baseline; flex-wrap: wrap; }
  .diff .k { font-size: var(--size-xs); color: var(--color-text-muted); min-width: 64px; }
  .diff code { font-family: var(--font-mono); font-size: 13px; padding: 2px 8px; border-radius: 6px; word-break: break-word; }
  .diff .got { background: color-mix(in srgb, var(--color-red) 20%, transparent); color: var(--color-red); }
  .diff .exp { background: color-mix(in srgb, var(--color-green) 20%, transparent); color: var(--color-green); }
  .nudge { margin: var(--space-3) 0 0; color: var(--color-text-muted); }
  .tag { font-size: var(--size-xs); color: var(--color-text-muted); }
  .val code { font-family: var(--font-mono); font-size: 13px; }
  .solution { margin-top: var(--space-4); }
  .status { margin-top: var(--space-2); }
  .cool { width: 100%; resize: vertical; font-family: var(--font-body); }

  .actionbar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 110;
    transform: translateY(calc(-1 * var(--kb)));
    background: color-mix(in srgb, var(--color-bg) 92%, transparent);
    -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
    border-top: 1px solid var(--color-border);
    padding: 10px var(--space-4) calc(10px + env(safe-area-inset-bottom));
  }
  .abrow { display: flex; gap: var(--space-2); align-items: center; max-width: 760px; margin: 0 auto; flex-wrap: wrap; }
  .run { flex: 0 0 auto; }
  .nextbtn { margin-left: auto; }
  .skip { margin-left: auto; }

  .complete { text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-6); }
  .checkring { width: 56px; height: 56px; color: var(--color-green); border: 2px solid color-mix(in srgb, var(--color-green) 50%, transparent); border-radius: var(--radius-dot); display: flex; align-items: center; justify-content: center; animation: pop .25s ease; }
  .checkring svg { width: 30px; height: 30px; }
  @keyframes pop { from { transform: scale(.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .checkring { animation: none; } }
</style>
