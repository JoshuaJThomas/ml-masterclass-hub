<script>
  import { onMount } from 'svelte';
  import { loadBank } from '../bank/loadBank.js';
  import { loadProgress } from '../srs/progress.js';
  import { loadActivity, currentStreak } from '../srs/activity.js';
  import { chapterMastery, summarize } from '../stats/mastery.js';
  import { loadSqlBank } from '../sql/loadSqlBank.js';
  import { exportData, importData } from '../srs/backup.js';
  import { getCurrentChapter, setCurrentChapter } from '../settings.js';

  // The "You" destination (DIRECTION.md §2): streak · heatmap · chapter mastery ·
  // current-chapter setting · backup. XP/levels/badges are gone (Anki, not Duolingo).
  // No location.reload() anywhere — state re-derives reactively after edits.

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

  async function load() {
    loading = true; error = '';
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
        sqlTotals = summarize(sqlBank.map((qq) => ({ ...qq, chapter: 1 })), progress, 1);
      } catch { /* SQL bank optional */ }
    } catch (e) {
      error = String(e.message || e);
    } finally {
      loading = false;
    }
  }

  onMount(load);

  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

  function onChapterChange(e) {
    setCurrentChapter(Number(e.target.value));
    load();
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
      if (r.ok) load();
      else alert('Import failed: ' + r.error);
    } catch {
      alert('That file is not a valid backup.');
    }
  }
</script>

<section class="container pad">
  {#if loading}
    <div class="skeleton s1"></div>
    <div class="skeleton s2"></div>
    <div class="skeleton s2"></div>
  {:else if error}
    <h1 class="heading-card">Couldn’t load progress</h1>
    <p class="body-large muted">{error}</p>
  {:else}
    <div class="stats">
      <div class="stat"><span class="num">{streak}</span><span class="lbl">day streak</span></div>
      <div class="stat"><span class="num">{totals.known}</span><span class="lbl">mastered</span></div>
      <div class="stat"><span class="num">{totals.seen}</span><span class="lbl">seen</span></div>
      <div class="stat"><span class="num">{totals.total}</span><span class="lbl">total</span></div>
    </div>

    <div class="setting">
      <label class="mono-label" for="cc">Currently on chapter</label>
      <select id="cc" value={currentChapter} onchange={onChapterChange}>
        {#each Array(MAX_CHAPTER) as _, i}<option value={i + 1}>{i + 1}</option>{/each}
      </select>
    </div>

    <h2 class="heading-feature">Activity</h2>
    <div class="heatmap" role="img" aria-label="practice activity, last 84 days">
      {#each heatmap as cell}<span class="cell lvl{cell.level}" title="{cell.date}: {cell.count}"></span>{/each}
    </div>

    <h2 class="heading-feature">Mastery by chapter</h2>
    <div class="bars">
      {#each rows as r}
        <div class="bar-row">
          <span class="bar-label">Ch {String(r.chapter).padStart(2, '0')} · {CHAPTER_NAMES[r.chapter] ?? ''}</span>
          <div class="track"><div class="fill" style="width: {pct(r.known, r.total)}%"></div></div>
          <span class="bar-num micro">{r.known}/{r.total}</span>
        </div>
      {/each}
    </div>

    <h2 class="heading-feature">SQL</h2>
    <p class="body-large muted">{sqlTotals.known} mastered · {sqlTotals.seen} seen · {sqlTotals.total} total</p>

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
  .pad { padding: var(--space-6) 0; }
  .muted { color: var(--color-text-muted); }
  .stats { display: flex; gap: var(--space-6); flex-wrap: wrap; margin-bottom: var(--space-6); }
  .stat { display: flex; flex-direction: column; }
  .stat .num { font-size: var(--size-xl); line-height: 1; color: var(--color-text); font-weight: 600; }
  .stat .lbl { font-size: var(--size-xs); color: var(--color-text-muted); margin-top: var(--space-1); }
  h2 { margin: var(--space-6) 0 var(--space-3); }
  .setting { display: flex; align-items: center; gap: var(--space-3); margin: var(--space-3) 0; }
  .setting label { margin: 0; }
  .heatmap { display: grid; grid-template-columns: repeat(14, 1fr); gap: 4px; max-width: 420px; }
  .cell { aspect-ratio: 1; border-radius: 3px; background: var(--color-raised-2); }
  .cell.lvl1 { background: color-mix(in srgb, var(--color-accent) 28%, var(--color-raised-2)); }
  .cell.lvl2 { background: color-mix(in srgb, var(--color-accent) 60%, var(--color-raised-2)); }
  .cell.lvl3 { background: var(--color-accent); }
  .bars { display: flex; flex-direction: column; gap: var(--space-3); max-width: 640px; }
  .bar-row { display: grid; grid-template-columns: 160px 1fr 48px; align-items: center; gap: var(--space-4); }
  .bar-label { font-size: var(--size-xs); color: var(--color-text-muted); }
  .track { height: 8px; background: var(--color-raised-2); border-radius: var(--radius-dot); overflow: hidden; }
  .fill { height: 100%; background: var(--color-accent); border-radius: var(--radius-dot); }
  .bar-num { text-align: right; }
  .backup { display: flex; gap: var(--space-4); align-items: center; flex-wrap: wrap; }
  .import { cursor: pointer; }
  .s1 { height: 64px; margin-bottom: var(--space-4); }
  .s2 { height: 120px; margin-bottom: var(--space-4); }
</style>
