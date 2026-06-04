<script>
  import { lineDiff } from '../diff/lineDiff.js';
  let { userCode = '', solution = '' } = $props();
  const rows = $derived(lineDiff(userCode, solution));
</script>

<div class="diff">
  <p class="legend micro">
    <span class="swatch del"></span> your code ·
    <span class="swatch add"></span> model solution
  </p>
  <pre class="lines">{#each rows as r}<span class="row {r.type}">{r.type === 'add' ? '+' : r.type === 'del' ? '-' : ' '} {r.text}
</span>{/each}</pre>
</div>

<style>
  .diff { margin-top: var(--space-lg); border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); overflow: hidden; }
  .legend { padding: var(--space-sm) var(--space-lg); margin: 0; border-bottom: 1px solid var(--color-hairline); }
  .swatch { display: inline-block; width: 10px; height: 10px; border-radius: 2px; vertical-align: middle; }
  .swatch.add { background: var(--color-pale-green); border: 1px solid #7cc6a8; }
  .swatch.del { background: #ffe7e0; border: 1px solid var(--color-coral-soft); }
  .lines { margin: 0; font-family: var(--font-mono); font-size: 13px; line-height: 1.5; overflow-x: auto; }
  .row { display: block; white-space: pre; padding: 0 var(--space-lg); }
  .row.add { background: var(--color-pale-green); }
  .row.del { background: #ffe7e0; }
</style>
