<script>
  import { onMount } from 'svelte';
  import { loadBank } from '../bank/loadBank.js';
  import { loadProgress } from '../srs/progress.js';
  import { loadActivity, currentStreak } from '../srs/activity.js';
  import { getCurrentChapter } from '../settings.js';
  import { buildSession } from '../srs/session.js';
  import { startSession } from '../stores/view.js';

  let loading = $state(true);
  let error = $state('');
  let data = $state(null);
  let streak = $state(0);
  let thisWeek = $state(0);

  const todayISO = () => new Date().toISOString().slice(0, 10);

  function weekCount(activity, now) {
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now); d.setUTCDate(d.getUTCDate() - i);
      sum += activity[d.toISOString().slice(0, 10)] || 0;
    }
    return sum;
  }

  onMount(async () => {
    try {
      const { meta, questions } = await loadBank(import.meta.env.BASE_URL);
      const progress = loadProgress();
      const activity = loadActivity();
      const now = new Date();
      data = buildSession(questions, getCurrentChapter(meta.completedThrough), progress, now);
      streak = currentStreak(activity, now);
      thisWeek = weekCount(activity, now);
    } catch (e) {
      error = String(e.message || e);
    } finally {
      loading = false;
    }
  });

  function start() {
    if (data && !data.empty) startSession(data);
  }
</script>

<section class="container pad">
  {#if loading}
    <div class="skeleton card-skel"></div>
    <div class="skeleton row-skel"></div>
  {:else if error}
    <div class="card">
      <h1 class="heading-card">Couldn’t load your set</h1>
      <p class="body-large muted">{error}</p>
    </div>
  {:else if data.empty}
    <div class="card done">
      <h1 class="heading-card">All caught up</h1>
      <p class="body-large muted">Nothing’s due and there are no new exercises in your current chapter. Come back later, or advance a chapter in <strong>You</strong> to unlock more.</p>
    </div>
    <div class="streakrow">
      <span class="stat-pill">{streak}-day streak</span>
      <span class="micro">{thisWeek} this week</span>
    </div>
  {:else}
    <div class="card today">
      <p class="mono-label">Today</p>
      <h1 class="heading-card">{data.counts.due} reviews · {data.counts.fresh} new</h1>
      <p class="body-large muted">A 3-act session — warm up, one real task, then explain it. About {data.counts.minutes} min.</p>
      <button class="btn-primary start" onclick={start}>Start session</button>
    </div>
    <div class="streakrow">
      <span class="stat-pill">{streak}-day streak</span>
      <span class="micro">{thisWeek} this week</span>
    </div>
  {/if}
</section>

<style>
  .pad { padding: var(--space-6) 0; }
  .muted { color: var(--color-text-muted); }
  .card { margin-top: var(--space-3); }
  .today .mono-label { margin: 0 0 var(--space-2); }
  .today h1 { margin: 0 0 var(--space-2); }
  .start { margin-top: var(--space-4); width: 100%; padding: 14px; font-size: var(--size-md); }
  .streakrow { display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-4); }
  .card-skel { height: 180px; margin-top: var(--space-3); }
  .row-skel { height: 36px; width: 60%; margin-top: var(--space-4); }
</style>
