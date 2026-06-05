<script>
  import Header from './lib/components/Header.svelte';
  import Learn from './lib/views/Learn.svelte';
  import Practice from './lib/views/Practice.svelte';
  import Progress from './lib/views/Progress.svelte';
  import Sql from './lib/views/Sql.svelte';
  import { view } from './lib/stores/view.js';
</script>

<Header />
<main>
  {#if $view === 'learn'}
    <Learn />
  {:else if $view === 'practice'}
    <Practice />
  {:else if $view === 'sql'}
    <Sql />
  {:else}
    <Progress />
  {/if}
</main>
<footer class="container">
  <span class="micro">Personal ML learning hub · built with Claude</span>
</footer>

<style>
  main { min-height: 70vh; }
  footer { padding: var(--space-xl) 0; border-top: 1px solid var(--color-hairline); margin-top: var(--space-section); }
</style>
