<script>
  import { onMount, onDestroy } from 'svelte';
  import { EditorView, basicSetup } from 'codemirror';
  import { EditorState } from '@codemirror/state';
  import { keymap } from '@codemirror/view';
  import { indentWithTab } from '@codemirror/commands';
  import { python } from '@codemirror/lang-python';
  import { sql } from '@codemirror/lang-sql';
  import { oneDark } from '@codemirror/theme-one-dark';

  let { value = $bindable(''), lang = 'python' } = $props();
  let host;
  let view;
  let applyingExternal = false;

  const hostTheme = EditorView.theme({
    '&': { borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-hairline)', fontSize: '16px' },
    '.cm-content': { fontFamily: 'var(--font-mono)', minHeight: '200px' },
    '.cm-scroller': { fontFamily: 'var(--font-mono)' },
    '&.cm-focused': { outline: '2px solid var(--color-focus-blue)', outlineOffset: '1px' },
  });

  onMount(() => {
    view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          (lang === 'sql' ? sql() : python()),
          keymap.of([indentWithTab]),
          oneDark,
          hostTheme,
          EditorView.updateListener.of((u) => {
            if (u.docChanged && !applyingExternal) value = u.state.doc.toString();
          }),
        ],
      }),
    });
  });

  // Reflect external value changes (e.g. navigating to a new exercise's starterCode).
  $effect(() => {
    const v = value;
    if (view && v !== view.state.doc.toString()) {
      applyingExternal = true;
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: v } });
      applyingExternal = false;
    }
  });

  onDestroy(() => view?.destroy());
</script>

<div class="editor-host" bind:this={host}></div>

<style>
  .editor-host { width: 100%; }
  :global(.editor-host .cm-editor) { max-height: 60vh; }
</style>
