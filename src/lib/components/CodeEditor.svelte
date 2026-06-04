<script>
  let { value = $bindable('') } = $props();
  function onKeydown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target;
      const s = el.selectionStart, en = el.selectionEnd;
      value = value.slice(0, s) + '    ' + value.slice(en);
      queueMicrotask(() => { el.selectionStart = el.selectionEnd = s + 4; });
    }
  }
</script>

<textarea
  class="editor"
  bind:value
  onkeydown={onKeydown}
  spellcheck="false"
  autocapitalize="off"
  autocomplete="off"
></textarea>

<style>
  .editor {
    width: 100%; min-height: 220px; resize: vertical;
    font-family: var(--font-mono); font-size: 14px; line-height: 1.5;
    color: var(--color-on-dark); background: var(--color-primary);
    border: 1px solid var(--color-hairline); border-radius: var(--radius-sm);
    padding: var(--space-lg); white-space: pre; overflow-wrap: normal; overflow-x: auto;
  }
  .editor:focus { outline: 2px solid var(--color-focus-blue); outline-offset: 1px; }
</style>
