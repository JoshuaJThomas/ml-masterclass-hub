<script>
  import { onMount } from 'svelte';
  import CodeEditor from '../components/CodeEditor.svelte';
  import Markdown from '../components/Markdown.svelte';
  import { loadLessons } from '../lessons/loadLessons.js';
  import { getPyodide, runGraded, runScratch, runExpected } from '../runner/pyodideRunner.js';
  import { burstConfetti } from '../confetti.js';
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
  let trying = $state(false);
  let result = $state(null);
  let scratch = $state(null);
  let expected = $state(null);

  const current = $derived(lessons[index]);
  const done = (id) => !!progress[id];
  const trunc = (s, n = 240) => (s == null ? s : s.length > n ? s.slice(0, n) + '…' : s);

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
    showHint = false; showSolution = false; usedHelp = false;
    result = null; scratch = null; expected = null;
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
    if (running || trying) return;
    running = true; result = null; scratch = null; expected = null;
    try {
      const pyodide = await getPyodide((s) => (status = s));
      const r = await runGraded(pyodide, code, current.check);
      result = r;
      if (r.passed) {
        if (!done(current.id)) markDone(true);
        burstConfetti();
      } else if (r.error === 'assert') {
        expected = await runExpected(pyodide, current.solution);
      }
    } catch (e) { result = { passed: false, stdout: '', error: String(e.message || e), value: null }; }
    finally { running = false; status = ''; }
  }

  async function tryIt() {
    if (running || trying) return;
    trying = true; scratch = null; result = null;
    try {
      const pyodide = await getPyodide((s) => (status = s));
      scratch = await runScratch(pyodide, code);
    } catch (e) { scratch = { error: String(e.message || e), value: null, stdout: '' }; }
    finally { trying = false; status = ''; }
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
              <div class="result ok"><strong>✓ Lesson complete!</strong>{#if result.stdout}<pre class="stdout">{result.stdout}</pre>{/if}</div>
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
  .nav { display: flex; gap: var(--space-md); }
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-xl); margin-top: var(--space-lg); }
  .teach { border-right: 1px solid var(--color-hairline); padding-right: var(--space-xl); }
  .actions { display: flex; gap: var(--space-md); flex-wrap: wrap; margin-top: var(--space-md); align-items: center; }
  .hint { background: var(--color-pale-green); border-radius: var(--radius-md); padding: var(--space-md); margin-top: var(--space-md); }

  .scratch { margin-top: var(--space-md); border-radius: var(--radius-md); padding: var(--space-md); background: var(--color-surface-2); }
  .scratch .tag { font-family: var(--font-mono); font-size: 11px; letter-spacing: .28px; color: var(--color-muted); }
  .scratch .val code { font-family: var(--font-mono); font-size: 13px; }

  .result { margin-top: var(--space-md); border-radius: var(--radius-md); padding: var(--space-md); border: 1px solid var(--color-card-border); box-shadow: var(--shadow-sm); }
  .result.ok  { background: var(--color-win-soft); border-color: transparent; }
  .result.bad { background: #fff6ec; border-color: transparent; }
  .result.err { background: var(--color-pale-blue); border-color: transparent; }
  .result strong { display: block; font-family: var(--font-display); font-size: 17px; }
  .result pre, .sol pre { font-family: var(--font-mono); font-size: 13px; white-space: pre-wrap; word-break: break-word; margin: var(--space-sm) 0 0; }
  .result .stdout { color: var(--color-body-muted); }
  .err-text { color: var(--color-error); font-family: var(--font-mono); font-size: 13px; white-space: pre-wrap; word-break: break-word; margin: var(--space-sm) 0 0; }

  .diff { display: flex; flex-direction: column; gap: var(--space-xs); margin-top: var(--space-md); }
  .diff .row { display: flex; gap: var(--space-md); align-items: baseline; flex-wrap: wrap; }
  .diff .k { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: .28px; color: var(--color-muted); min-width: 72px; }
  .diff code { font-family: var(--font-mono); font-size: 13px; padding: 2px 8px; border-radius: var(--radius-xs); word-break: break-word; }
  .diff .got { background: #ffe2d6; color: #8a2c12; }
  .diff .exp { background: var(--color-win-soft); color: #155e3f; }
  .nudge { margin: var(--space-md) 0 0; color: var(--color-body-muted); }

  .sol { margin-top: var(--space-md); }
  @media (max-width: 860px) {
    .wrap { flex-direction: column; }
    .toc { position: static; max-height: none; flex-basis: auto; }
    .split { grid-template-columns: 1fr; }
    .teach { border-right: none; border-bottom: 1px solid var(--color-hairline); padding-right: 0; padding-bottom: var(--space-lg); }
  }
</style>
