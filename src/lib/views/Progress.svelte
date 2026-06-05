<script>
  import { onMount } from 'svelte';
  import { loadBank } from '../bank/loadBank.js';
  import { loadProgress } from '../srs/progress.js';
  import { loadActivity, currentStreak } from '../srs/activity.js';
  import { chapterMastery, summarize } from '../stats/mastery.js';
  import { loadSqlBank } from '../sql/loadSqlBank.js';
  import { exportData, importData } from '../srs/backup.js';
  import { getCurrentChapter, setCurrentChapter } from '../settings.js';

  let loading = $state(true);
  let error = $state('');
  let rows = $state([]);
  let totals = $state({ total: 0, seen: 0, known: 0 });
  let streak = $state(0);
  let heatmap = $state([]);
  let sqlTotals = $state({ total: 0, seen: 0, known: 0 });
  let currentChapter = $state(1);
  const MAX_CHAPTER = 24;

  const CHAPTER_NAMES = {
    1: 'Python', 2: 'NumPy', 3: 'pandas', 4: 'Matplotlib', 5: 'Seaborn',
    6: 'Capstone', 7: 'ML Overview', 8: 'Linear Regression',
  };

  function buildHeatmap(activity, today, days = 84) {
    const cells = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const date = d.toISOString().slice(0, 10);
      const count = activity[date] || 0;
      const level = count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : 3;
      cells.push({ date, count, level });
    }
    return cells;
  }

  onMount(async () => {
    try {
      const { meta, questions } = await loadBank(import.meta.env.BASE_URL);
      const progress = loadProgress();
      const activity = loadActivity();
      const now = new Date();
      currentChapter = getCurrentChapter(meta.completedThrough);
      rows = chapterMastery(questions, progress, meta.completedThrough);
      totals = summarize(questions, progress, meta.completedThrough);
      streak = currentStreak(activity, now);
      heatmap = buildHeatmap(activity, now);
      try {
        const sqlBank = await loadSqlBank(import.meta.env.BASE_URL);
        sqlTotals = summarize(sqlBank.map((q) => ({ ...q, chapter: 1 })), progress, 1);
      } catch { /* SQL bank optional */ }
    } catch (e) {
      error = String(e.message || e);
    } finally {
      loading = false;
    }
  });

  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

  function onChapterChange(e) {
    setCurrentChapter(Number(e.target.value));
    location.reload();
  }

  function doExport() {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mlhub-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function doImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const obj = JSON.parse(await file.text());
      const r = importData(obj);
      if (r.ok) location.reload();
      else alert('Import failed: ' + r.error);
    } catch {
      alert('That file is not a valid backup.');
    }
  }
</script>

<section class="container pad">
  {#if loading}
    <p class="mono-label">LOADING…</p>
  {:else if error}
    <p class="mono-label" style="color: var(--color-error)">COULD NOT LOAD PROGRESS</p>
    <p class="body-large">{error}</p>
  {:else}
    <p class="mono-label" style="color: var(--color-deep-green)">YOUR PROGRESS</p>

    <div class="setting">
      <label class="mono-label" for="cc">I'M CURRENTLY ON CHAPTER</label>
      <select id="cc" value={currentChapter} onchange={onChapterChange}>
        {#each Array(MAX_CHAPTER) as _, i}<option value={i + 1}>{i + 1}</option>{/each}
      </select>
    </div>

    <div class="stats">
      <div class="stat"><span class="num">{streak}</span><span class="lbl">day streak</span></div>
      <div class="stat"><span class="num">{totals.known}</span><span class="lbl">mastered</span></div>
      <div class="stat"><span class="num">{totals.seen}</span><span class="lbl">seen</span></div>
      <div class="stat"><span class="num">{totals.total}</span><span class="lbl">total</span></div>
    </div>

    <h2 class="heading-feature">Activity</h2>
    <div class="heatmap" role="img" aria-label="practice activity, last 84 days">
      {#each heatmap as cell}
        <span class="cell lvl{cell.level}" title="{cell.date}: {cell.count}"></span>
      {/each}
    </div>

    <h2 class="heading-feature">Mastery by chapter</h2>
    <div class="bars">
      {#each rows as r}
        <div class="bar-row">
          <span class="bar-label">CH {String(r.chapter).padStart(2, '0')} · {CHAPTER_NAMES[r.chapter] ?? ''}</span>
          <div class="track"><div class="fill" style="width: {pct(r.known, r.total)}%"></div></div>
          <span class="bar-num micro">{r.known}/{r.total}</span>
        </div>
      {/each}
    </div>

    <h2 class="heading-feature">SQL</h2>
    <p class="body-large">{sqlTotals.known} mastered · {sqlTotals.seen} seen · {sqlTotals.total} total</p>

    <h2 class="heading-feature">Backup</h2>
    <div class="backup">
      <button class="btn-secondary" onclick={doExport}>Export progress</button>
      <label class="btn-secondary import">Import progress
        <input type="file" accept="application/json" onchange={doImport} hidden />
      </label>
    </div>
  {/if}
</section>

<style>
  .pad { padding: var(--space-xxl) 0 var(--space-section); }
  .stats { display: flex; gap: var(--space-section); flex-wrap: wrap; margin: var(--space-xl) 0 var(--space-section); }
  .stat { display: flex; flex-direction: column; }
  .stat .num { font-family: var(--font-display); font-size: 48px; line-height: 1; color: var(--color-deep-green); }
  .stat .lbl { font-family: var(--font-mono); font-size: 12px; text-transform: uppercase; color: var(--color-muted); letter-spacing: 0.28px; margin-top: var(--space-xs); }
  h2 { margin: var(--space-xl) 0 var(--space-lg); }
  .heatmap { display: grid; grid-template-columns: repeat(14, 1fr); gap: 4px; max-width: 420px; }
  .cell { aspect-ratio: 1; border-radius: var(--radius-xs); background: var(--color-soft-stone); }
  .cell.lvl1 { background: var(--color-pale-green); }
  .cell.lvl2 { background: #7cc6a8; }
  .cell.lvl3 { background: var(--color-deep-green); }
  .bars { display: flex; flex-direction: column; gap: var(--space-md); max-width: 640px; }
  .bar-row { display: grid; grid-template-columns: 180px 1fr 48px; align-items: center; gap: var(--space-lg); }
  .bar-label { font-family: var(--font-mono); font-size: 12px; text-transform: uppercase; letter-spacing: 0.28px; color: var(--color-ink); }
  .track { height: 8px; background: var(--color-soft-stone); border-radius: var(--radius-full); overflow: hidden; }
  .fill { height: 100%; background: var(--color-deep-green); border-radius: var(--radius-full); }
  .bar-num { text-align: right; }
  .backup { display: flex; gap: var(--space-xl); align-items: center; }
  .import { cursor: pointer; }
  .setting { display: flex; align-items: center; gap: var(--space-md); margin: var(--space-lg) 0; }
  .setting select { font-family: var(--font-mono); padding: 4px 8px; border: 1px solid var(--color-hairline); border-radius: var(--radius-xs); }
</style>
