<script>
  import Library from './Library.svelte';
  import Learn from './Learn.svelte';
  import Sql from './Sql.svelte';

  // SQL is content, not a destination (DIRECTION.md §2). The Library hub folds the old
  // Library / Learn / SQL tabs behind one segmented filter.
  let tab = $state('exercises');
  const tabs = [
    { id: 'exercises', label: 'Exercises' },
    { id: 'lessons', label: 'Lessons' },
    { id: 'sql', label: 'SQL' },
  ];
</script>

<div class="hub container">
  <div class="seg" role="tablist" aria-label="Library">
    {#each tabs as t}
      <button class="btn-chip" class:active={tab === t.id} role="tab" aria-selected={tab === t.id} onclick={() => (tab = t.id)}>{t.label}</button>
    {/each}
  </div>
</div>

{#if tab === 'exercises'}
  <Library />
{:else if tab === 'lessons'}
  <Learn />
{:else}
  <Sql />
{/if}

<style>
  .hub { padding-top: var(--space-4); }
  .seg { display: flex; gap: var(--space-2); }
</style>
