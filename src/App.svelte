<script>
  import Header from './lib/components/Header.svelte';
  import BottomTabBar from './lib/components/BottomTabBar.svelte';
  import Learn from './lib/views/Learn.svelte';
  import Practice from './lib/views/Practice.svelte';
  import Progress from './lib/views/Progress.svelte';
  import Sql from './lib/views/Sql.svelte';
  import Library from './lib/views/Library.svelte';
  import { view } from './lib/stores/view.js';
  import { fly } from 'svelte/transition';
</script>

<Header />
<main>
  {#key $view}
    <div class="view" in:fly={{ y: 10, duration: 200 }}>
      {#if $view === 'learn'}
        <Learn />
      {:else if $view === 'practice'}
        <Practice />
      {:else if $view === 'sql'}
        <Sql />
      {:else if $view === 'library'}
        <Library />
      {:else}
        <Progress />
      {/if}
    </div>
  {/key}
</main>
<BottomTabBar />

<style>
  main { min-height: 70vh; padding-bottom: calc(96px + env(safe-area-inset-bottom)); }
</style>
