<script>
  import { onMount } from 'svelte';
  import { loadPlayerStats } from '../stores/playerStats.js';

  let stats = $state({ streak: 0, xp: 0, level: 1, xpIntoLevel: 0 });

  onMount(async () => {
    try { stats = await loadPlayerStats(); } catch { /* keep defaults */ }
  });
</script>

<header class="bar">
  <div class="brand">
    <span class="logo" aria-hidden="true">🐍</span>
    <span class="name">ML Masterclass</span>
  </div>
  <div class="pills">
    <span class="stat-pill streak" title="{stats.streak}-day streak">🔥 {stats.streak}</span>
    <span class="stat-pill xp" title="Level {stats.level} · {stats.xp} XP">⭐ {stats.xp}</span>
  </div>
</header>

<style>
  .bar {
    position: sticky; top: 0; z-index: 40;
    display: flex; align-items: center; justify-content: space-between; gap: var(--space-md);
    padding: calc(env(safe-area-inset-top) + 10px) var(--space-lg) 10px;
    background: color-mix(in srgb, var(--color-surface) 80%, transparent);
    -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-card-border);
  }
  .brand { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .logo { font-size: 20px; line-height: 1; }
  .name {
    font-family: var(--font-display); font-weight: 600; font-size: 16px; letter-spacing: -.2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .pills { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .stat-pill.streak { background: color-mix(in srgb, var(--color-streak-flame) 14%, transparent); color: var(--color-streak-flame); }
  .stat-pill.xp { background: color-mix(in srgb, var(--color-xp-gold) 16%, transparent); color: var(--color-xp-gold); }
  @media (max-width: 360px) { .name { display: none; } }
</style>
