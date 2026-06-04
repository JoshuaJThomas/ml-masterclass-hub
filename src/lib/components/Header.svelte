<script>
  import { view } from '../stores/view.js';
</script>

<header>
  <div class="container bar">
    <span class="brand mono-label">ML · MASTERCLASS</span>
    <nav>
      <button class:active={$view === 'practice'} onclick={() => view.set('practice')}>Practice</button>
      <button class:active={$view === 'progress'} onclick={() => view.set('progress')}>Progress</button>
    </nav>
    <span class="micro">v0.1</span>
  </div>
</header>

<style>
  header { border-bottom: 1px solid var(--color-hairline); background: var(--color-canvas); }
  .bar { display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .brand { letter-spacing: 0.28px; }
  nav { display: flex; gap: var(--space-xl); }
  nav button {
    background: none; border: none; cursor: pointer; font-family: var(--font-body);
    font-size: 16px; color: var(--color-muted); padding: 4px 0;
    border-bottom: 2px solid transparent;
  }
  nav button.active { color: var(--color-ink); border-bottom-color: var(--color-deep-green); }
</style>
