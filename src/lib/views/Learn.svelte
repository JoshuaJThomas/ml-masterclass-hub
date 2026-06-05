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
