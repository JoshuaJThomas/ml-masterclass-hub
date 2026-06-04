<script>
  let { columns = [], rows = [], caption = '' } = $props();
</script>

{#if columns.length}
  <table class="rt">
    {#if caption}<caption class="mono-label">{caption}</caption>{/if}
    <thead><tr>{#each columns as c}<th>{c}</th>{/each}</tr></thead>
    <tbody>
      {#each rows as r}<tr>{#each r as cell}<td>{cell ?? 'NULL'}</td>{/each}</tr>{/each}
    </tbody>
  </table>
{:else}
  <p class="micro">(no rows)</p>
{/if}

<style>
  .rt { border-collapse: collapse; font-family: var(--font-mono); font-size: 13px; margin-top: var(--space-sm); }
  caption { text-align: left; padding-bottom: var(--space-xs); color: var(--color-muted); }
  th, td { border: 1px solid var(--color-hairline); padding: 4px 10px; text-align: left; }
  th { background: var(--color-soft-stone); }
</style>
