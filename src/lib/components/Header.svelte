<script>
  // Slim wordmark only. Streak/stats live quietly in Today and You now (the XP/level
  // pills are gone — Anki psychology, not Duolingo).
</script>

<header class="bar">
  <span class="name">ML Masterclass</span>
</header>

<style>
  .bar {
    position: sticky; top: 0; z-index: 40;
    display: flex; align-items: center;
    padding: calc(env(safe-area-inset-top) + 12px) var(--space-4) 12px;
    background: color-mix(in srgb, var(--color-bg) 82%, transparent);
    -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
  }
  .name {
    font-weight: 600; font-size: var(--size-sm); letter-spacing: -0.01em;
    color: var(--color-text);
  }
</style>
