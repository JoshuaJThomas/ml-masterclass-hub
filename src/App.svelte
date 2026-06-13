<script>
  import Header from './lib/components/Header.svelte';
  import TabBar from './lib/components/TabBar.svelte';
  import Today from './lib/views/Today.svelte';
  import LibraryHub from './lib/views/LibraryHub.svelte';
  import You from './lib/views/You.svelte';
  import Session from './lib/views/Session.svelte';
  import { view, session } from './lib/stores/view.js';
  import { fade } from 'svelte/transition';
</script>

{#if $session.active}
  <Session />
{:else}
  <Header />
  <main>
    {#key $view}
      <div class="view" in:fade={{ duration: 150 }}>
        {#if $view === 'today'}
          <Today />
        {:else if $view === 'library'}
          <LibraryHub />
        {:else}
          <You />
        {/if}
      </div>
    {/key}
  </main>
  <TabBar />
{/if}

<style>
  main { min-height: 70vh; padding-bottom: calc(84px + env(safe-area-inset-bottom)); }
</style>
