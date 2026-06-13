<script>
  import { view } from '../stores/view.js';

  // Three destinations (DIRECTION.md §2). Minimal inline-SVG icons — no emoji.
  const tabs = [
    { id: 'today',   label: 'Today' },
    { id: 'library', label: 'Library' },
    { id: 'you',     label: 'You' },
  ];
</script>

<nav class="tabbar" aria-label="Main">
  {#each tabs as t}
    <button
      class="tab"
      class:active={$view === t.id}
      aria-current={$view === t.id ? 'page' : undefined}
      onclick={() => view.set(t.id)}
    >
      <span class="icon" aria-hidden="true">
        {#if t.id === 'today'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V20h12V9.5"/></svg>
        {:else if t.id === 'library'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6" height="16" rx="1"/><rect x="13" y="4" width="6" height="16" rx="1"/><path d="M13 9h6"/></svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"/></svg>
        {/if}
      </span>
      <span class="lbl">{t.label}</span>
    </button>
  {/each}
</nav>

<style>
  .tabbar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
    display: grid; grid-template-columns: repeat(3, 1fr);
    padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
    background: color-mix(in srgb, var(--color-bg) 88%, transparent);
    -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
    border-top: 1px solid var(--color-border);
  }
  .tab {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    background: none; border: none; cursor: pointer;
    padding: 8px 0 4px; border-radius: var(--radius-control);
    color: var(--color-text-faint);
    transition: color .15s ease;
  }
  .tab .icon { width: 24px; height: 24px; }
  .tab .icon svg { width: 100%; height: 100%; display: block; }
  .tab .lbl { font-size: 11px; font-weight: 600; }
  .tab:hover { color: var(--color-text-muted); }
  .tab.active { color: var(--color-accent); }

  @media (min-width: 860px) {
    .tabbar { max-width: 480px; margin: 0 auto; bottom: 16px;
      border: 1px solid var(--color-border); border-radius: var(--radius-card); }
  }
</style>
