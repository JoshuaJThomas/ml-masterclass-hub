# Progress Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the Progress placeholder with a real dashboard: per-chapter mastery bars, a practice streak, a GitHub-style activity heatmap, and headline totals — all derived from the localStorage SRS state.

**Architecture:** Two pure stat modules (`activity.js` for the day-by-day practice log + streak, `mastery.js` for per-chapter/summary stats from FSRS card states). Practice logs a review-day on each grade. `Progress.svelte` loads bank + progress + activity and renders the dashboard with Cohere styling.

**Tech Stack:** Svelte 5, Vitest.

---

## File Structure

- `src/lib/srs/activity.js` — `logReview`, `loadActivity`, `currentStreak`.
- `src/lib/stats/mastery.js` — `chapterMastery`, `summarize`.
- `*.test.js` for each.
- Modify: `src/lib/views/Practice.svelte` (log a review day on grade).
- Create: `src/lib/views/Progress.svelte`; modify `src/App.svelte` (use it; delete ProgressPlaceholder).

---

## Task 1: Activity log + streak (pure)

**Files:** Create `src/lib/srs/activity.js`, `src/lib/srs/activity.test.js`.

- [ ] **Step 1: Write the failing test** — `src/lib/srs/activity.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { loadActivity, logReview, currentStreak } from './activity.js';

function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
}

describe('activity', () => {
  it('logs and counts reviews per day', () => {
    const s = fakeStorage();
    logReview('2026-06-04', s);
    const a = logReview('2026-06-04', s);
    expect(a['2026-06-04']).toBe(2);
    expect(loadActivity(s)['2026-06-04']).toBe(2);
  });

  it('counts a consecutive streak ending today', () => {
    const a = { '2026-06-02': 1, '2026-06-03': 2, '2026-06-04': 1 };
    expect(currentStreak(a, new Date('2026-06-04T12:00:00Z'))).toBe(3);
  });

  it('still counts a streak when today has no activity yet (grace via yesterday)', () => {
    const a = { '2026-06-02': 1, '2026-06-03': 1 };
    expect(currentStreak(a, new Date('2026-06-04T12:00:00Z'))).toBe(2);
  });

  it('breaks the streak on a gap', () => {
    const a = { '2026-06-01': 1, '2026-06-04': 1 };
    expect(currentStreak(a, new Date('2026-06-04T12:00:00Z'))).toBe(1);
  });

  it('is zero with no recent activity', () => {
    expect(currentStreak({}, new Date('2026-06-04T12:00:00Z'))).toBe(0);
  });
});
```

- [ ] **Step 2: Run `npm test`** — Expected FAIL.

- [ ] **Step 3: Implement `src/lib/srs/activity.js`:**
```js
const KEY = 'mlhub.activity.v1';

function getStore(storage) {
  return storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
}

export function loadActivity(storage) {
  const store = getStore(storage);
  if (!store) return {};
  try {
    return JSON.parse(store.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

// Increment the review counter for a YYYY-MM-DD day. Returns the updated map.
export function logReview(dateStr, storage) {
  const store = getStore(storage);
  const map = loadActivity(storage);
  map[dateStr] = (map[dateStr] || 0) + 1;
  if (store) store.setItem(KEY, JSON.stringify(map));
  return map;
}

const dayKey = (d) => d.toISOString().slice(0, 10);

// Consecutive days with activity ending today (or yesterday, as grace for the current day).
export function currentStreak(activity, today = new Date()) {
  const cursor = new Date(today);
  if (!activity[dayKey(cursor)]) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (activity[dayKey(cursor)]) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
```

- [ ] **Step 4: Run `npm test`** — Expected PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/srs/activity.js src/lib/srs/activity.test.js
git commit -m "feat: activity log and streak computation"
```

---

## Task 2: Mastery stats (pure)

**Files:** Create `src/lib/stats/mastery.js`, `src/lib/stats/mastery.test.js`.

- [ ] **Step 1: Write the failing test** — `src/lib/stats/mastery.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { chapterMastery, summarize } from './mastery.js';

// FSRS State: 0 New, 1 Learning, 2 Review (mastered), 3 Relearning.
const questions = [
  { id: 'ch01-a-01', chapter: 1 },
  { id: 'ch01-b-02', chapter: 1 },
  { id: 'ch02-c-01', chapter: 2 },
  { id: 'ch09-d-01', chapter: 9 }, // out of scope
];
const progress = {
  'ch01-a-01': { state: 2 }, // known
  'ch01-b-02': { state: 1 }, // seen, learning
};

describe('mastery', () => {
  it('reports per-chapter totals, seen, and known for completed chapters only', () => {
    const rows = chapterMastery(questions, progress, 8);
    expect(rows).toEqual([
      { chapter: 1, total: 2, seen: 2, known: 1 },
      { chapter: 2, total: 1, seen: 0, known: 0 },
    ]);
  });

  it('summarizes in-scope totals', () => {
    expect(summarize(questions, progress, 8)).toEqual({ total: 3, seen: 2, known: 1 });
  });
});
```

- [ ] **Step 2: Run `npm test`** — Expected FAIL.

- [ ] **Step 3: Implement `src/lib/stats/mastery.js`:**
```js
// FSRS State 2 === Review === "mastered" for our purposes.
const MASTERED = 2;

export function chapterMastery(questions, progress, completedThrough) {
  const rows = [];
  for (let ch = 1; ch <= completedThrough; ch++) {
    const inCh = questions.filter((q) => q.chapter === ch);
    if (!inCh.length) continue;
    const seen = inCh.filter((q) => progress[q.id]).length;
    const known = inCh.filter((q) => progress[q.id]?.state === MASTERED).length;
    rows.push({ chapter: ch, total: inCh.length, seen, known });
  }
  return rows;
}

export function summarize(questions, progress, completedThrough) {
  const inScope = questions.filter((q) => q.chapter <= completedThrough);
  const seen = inScope.filter((q) => progress[q.id]).length;
  const known = inScope.filter((q) => progress[q.id]?.state === MASTERED).length;
  return { total: inScope.length, seen, known };
}
```

- [ ] **Step 4: Run `npm test`** — Expected PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/stats/mastery.js src/lib/stats/mastery.test.js
git commit -m "feat: per-chapter mastery and summary stats"
```

---

## Task 3: Log a review day from Practice

**Files:** Modify `src/lib/views/Practice.svelte`.

- [ ] **Step 1: Add the import.** After the line `import { loadProgress, recordReview } from '../srs/progress.js';` add:
```js
  import { logReview } from '../srs/activity.js';
```

- [ ] **Step 2: Log the day inside `gradeOnce`.** In the `gradeOnce` function, immediately after the `recordReview(current.id, next);` line, add:
```js
    logReview(new Date().toISOString().slice(0, 10));
```

- [ ] **Step 3: Verify** — `npm run build` and `npm test` both pass.

- [ ] **Step 4: Commit**
```bash
git add src/lib/views/Practice.svelte
git commit -m "feat: record a practice day in the activity log on each grade"
```

---

## Task 4: Progress dashboard view

**Files:** Create `src/lib/views/Progress.svelte`; modify `src/App.svelte`; delete `src/lib/views/ProgressPlaceholder.svelte`.

- [ ] **Step 1: Create `src/lib/views/Progress.svelte`:**
```svelte
<script>
  import { onMount } from 'svelte';
  import { loadBank } from '../bank/loadBank.js';
  import { loadProgress } from '../srs/progress.js';
  import { loadActivity, currentStreak } from '../srs/activity.js';
  import { chapterMastery, summarize } from '../stats/mastery.js';

  let loading = $state(true);
  let error = $state('');
  let rows = $state([]);
  let totals = $state({ total: 0, seen: 0, known: 0 });
  let streak = $state(0);
  let heatmap = $state([]); // [{ date, count, level }]

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
      rows = chapterMastery(questions, progress, meta.completedThrough);
      totals = summarize(questions, progress, meta.completedThrough);
      streak = currentStreak(activity, now);
      heatmap = buildHeatmap(activity, now);
    } catch (e) {
      error = String(e.message || e);
    } finally {
      loading = false;
    }
  });

  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
</script>

<section class="container pad">
  {#if loading}
    <p class="mono-label">LOADING…</p>
  {:else if error}
    <p class="mono-label" style="color: var(--color-error)">COULD NOT LOAD PROGRESS</p>
    <p class="body-large">{error}</p>
  {:else}
    <p class="mono-label" style="color: var(--color-deep-green)">YOUR PROGRESS</p>

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
</style>
```

- [ ] **Step 2: Wire into `src/App.svelte`** — change `import ProgressPlaceholder from './lib/views/ProgressPlaceholder.svelte';` to `import Progress from './lib/views/Progress.svelte';`, and change `<ProgressPlaceholder />` to `<Progress />`. Then delete `src/lib/views/ProgressPlaceholder.svelte` (confirm via grep that nothing else imports it first).

- [ ] **Step 3: Verify** — `npm run build` (no errors/warnings) and `npm test` (all pass).

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat: progress dashboard with streak, heatmap, and per-chapter mastery"
```

---

## Self-Review

- **Spec coverage:** per-chapter mastery bars ✓ (T2 + T4); streak ✓ (T1 + T4); GitHub-style heatmap ✓ (T4 buildHeatmap); headline totals ✓ (T2 summarize + T4); all derived from localStorage SRS state, no backend ✓. Activity logging is wired from Practice ✓ (T3).
- **Placeholder scan:** no TBDs; pure modules fully tested; the dashboard view is given in full and styled with tokens.
- **Type consistency:** `chapterMastery(...)` → `[{chapter,total,seen,known}]` and `summarize(...)` → `{total,seen,known}` consumed exactly in Progress; `currentStreak(activity, today)` and `logReview(dateStr)` / `loadActivity()` signatures match callers; FSRS `state === 2` mastery rule consistent between mastery.js and its test.
```
