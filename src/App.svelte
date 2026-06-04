<script>
  import Header from './lib/components/Header.svelte';
  import Practice from './lib/views/Practice.svelte';
  import ProgressPlaceholder from './lib/views/ProgressPlaceholder.svelte';
  import { view } from './lib/stores/view.js';
</script>

<Header />
<main>
  {#if $view === 'practice'}
    <Practice />
  {:else}
    <ProgressPlaceholder />
  {/if}
</main>
<footer class="container">
  <span class="micro">Personal ML learning hub · built with Claude</span>
</footer>

<style>
  main { min-height: 70vh; }
  footer { padding: var(--space-xl) 0; border-top: 1px solid var(--color-hairline); margin-top: var(--space-section); }
</style>
