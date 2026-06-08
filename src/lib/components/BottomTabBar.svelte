<script>
  import { view } from '../stores/view.js';

  const tabs = [
    { id: 'practice', label: 'Practice', icon: '🎯' },
    { id: 'learn',    label: 'Learn',    icon: '📚' },
    { id: 'sql',      label: 'SQL',      icon: '🗃️' },
    { id: 'library',  label: 'Library',  icon: '📖' },
    { id: 'progress', label: 'Progress', icon: '📊' },
  ];
</script>

<nav class="tabbar" aria-label="Main navigation">
  {#each tabs as t}
    <button
      class="tab"
      class:active={$view === t.id}
      aria-current={$view === t.id ? 'page' : undefined}
      onclick={() => view.set(t.id)}
    >
      <span class="icon" aria-hidden="true">{t.icon}</span>
      <span class="lbl">{t.label}</span>
    </button>
  {/each}
</nav>

<style>
  .tabbar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px;
    padding: 6px 6px calc(6px + env(safe-area-inset-bottom));
    background: color-mix(in srgb, var(--color-canvas) 82%, transparent);
    -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
    border-top: 1px solid var(--color-card-border);
    box-shadow: 0 -8px 24px rgba(23,23,28,0.06);
  }
  .tab {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
    background: none; border: none; cursor: pointer;
    padding: 8px 0 6px; border-radius: var(--radius-md);
    color: var(--color-muted);
    transition: color .15s ease, transform .15s cubic-bezier(.2,.8,.2,1), background .15s ease;
  }
  .tab .icon {
    font-size: 22px; line-height: 1; filter: grayscale(.4);
    transition: transform .18s cubic-bezier(.2,.8,.2,1), filter .15s ease;
  }
  .tab .lbl { font-family: var(--font-body); font-size: 11px; font-weight: 600; letter-spacing: .1px; }
  .tab:hover { color: var(--color-ink); }
  .tab:active { transform: scale(.9); }
  .tab.active { color: var(--color-tab-active); background: color-mix(in srgb, var(--color-tab-active) 12%, transparent); }
  .tab.active .icon { transform: translateY(-2px) scale(1.12); filter: grayscale(0); }

  /* On wide screens, float it as a centered pill — app-like, not a full-width web bar */
  @media (min-width: 860px) {
    .tabbar {
      max-width: 560px; margin: 0 auto; bottom: 16px;
      border: 1px solid var(--color-card-border); border-radius: var(--radius-pill);
      padding: 6px; box-shadow: var(--shadow-lg);
    }
  }
</style>
