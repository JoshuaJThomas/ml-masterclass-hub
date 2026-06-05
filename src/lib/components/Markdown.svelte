<script>
  import { marked } from 'marked';
  let { source = '' } = $props();
  const html = $derived(marked.parse(source ?? '', { async: false }));
</script>

<div class="md">{@html html}</div>

<style>
  .md :global(h1) { font-size: 28px; line-height: 1.2; margin: 0 0 var(--space-md); }
  .md :global(h2) { font-size: 20px; margin: var(--space-xl) 0 var(--space-sm); }
  .md :global(h3) { font-size: 16px; margin: var(--space-lg) 0 var(--space-xs); }
  .md :global(p), .md :global(li) { font-size: 15px; line-height: 1.6; color: var(--color-ink); }
  .md :global(code) { font-family: var(--font-mono); font-size: 13px; background: var(--color-soft-stone); padding: 1px 5px; border-radius: var(--radius-xs); }
  .md :global(pre) { background: var(--color-primary); color: var(--color-on-dark); padding: var(--space-md) var(--space-lg); border-radius: var(--radius-sm); overflow-x: auto; }
  .md :global(pre code) { background: none; color: inherit; padding: 0; }
  .md :global(strong) { font-weight: 600; }
</style>
