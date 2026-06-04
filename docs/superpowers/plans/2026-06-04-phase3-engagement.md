# Phase 3 Engagement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A CodeMirror syntax-highlighted editor and an after-pass highlighted line-diff comparing the learner's submitted code to the model solution.

**Architecture:** A pure `lineDiff()` (wraps the `diff` library) feeds a presentational `SolutionDiff.svelte`. `CodeEditor.svelte` is rewritten on CodeMirror 6 keeping its `value` bindable interface so `Practice.svelte` only gains the compare toggle.

**Tech Stack:** Svelte 5, Vitest, CodeMirror 6, `diff`.

---

## Task 1: lineDiff helper (TDD)

**Files:** Create `src/lib/diff/lineDiff.js`, `src/lib/diff/lineDiff.test.js`. Modify `package.json` (dep).

- [ ] **Step 1: Install diff** — `npm install diff`

- [ ] **Step 2: Write the failing test** — `src/lib/diff/lineDiff.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { lineDiff } from './lineDiff.js';

describe('lineDiff', () => {
  it('marks unchanged lines as same', () => {
    const rows = lineDiff('a\nb', 'a\nb');
    expect(rows).toEqual([{ type: 'same', text: 'a' }, { type: 'same', text: 'b' }]);
  });

  it('marks added and removed lines', () => {
    const rows = lineDiff('a\nb', 'a\nc');
    expect(rows).toContainEqual({ type: 'same', text: 'a' });
    expect(rows).toContainEqual({ type: 'del', text: 'b' });
    expect(rows).toContainEqual({ type: 'add', text: 'c' });
  });

  it('handles an empty user input as all additions', () => {
    expect(lineDiff('', 'x')).toEqual([{ type: 'add', text: 'x' }]);
  });

  it('splits multi-line hunks into individual rows', () => {
    const rows = lineDiff('', 'x\ny');
    expect(rows).toEqual([{ type: 'add', text: 'x' }, { type: 'add', text: 'y' }]);
  });
});
```

- [ ] **Step 3: Run `npm test`** — Expected FAIL.

- [ ] **Step 4: Implement `src/lib/diff/lineDiff.js`:**
```js
import { diffLines } from 'diff';

// Compare two code strings; return one row per line:
// { type: 'add' | 'del' | 'same', text }. `add` = present in solution only,
// `del` = present in user code only.
export function lineDiff(userCode, solution) {
  const parts = diffLines(userCode ?? '', solution ?? '');
  const rows = [];
  for (const part of parts) {
    const type = part.added ? 'add' : part.removed ? 'del' : 'same';
    const lines = part.value.split('\n');
    if (lines.length && lines[lines.length - 1] === '') lines.pop(); // drop trailing newline's empty
    for (const text of lines) rows.push({ type, text });
  }
  return rows;
}
```

- [ ] **Step 5: Run `npm test`** — Expected PASS.

- [ ] **Step 6: Commit**
```bash
git add package.json package-lock.json src/lib/diff/lineDiff.js src/lib/diff/lineDiff.test.js
git commit -m "feat: line-diff helper for solution comparison"
```

---

## Task 2: SolutionDiff component

**Files:** Create `src/lib/components/SolutionDiff.svelte`.

- [ ] **Step 1: Create `src/lib/components/SolutionDiff.svelte`:**
```svelte
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
```

- [ ] **Step 2: Verify build** — `npm run build` and `npm test` pass.

- [ ] **Step 3: Commit**
```bash
git add src/lib/components/SolutionDiff.svelte
git commit -m "feat: SolutionDiff component renders a colored line diff"
```

---

## Task 3: CodeMirror editor

**Files:** Rewrite `src/lib/components/CodeEditor.svelte`. Modify `package.json` (deps).

- [ ] **Step 1: Install CodeMirror** — `npm install codemirror @codemirror/lang-python @codemirror/theme-one-dark @codemirror/commands @codemirror/state @codemirror/view`

- [ ] **Step 2: Replace `src/lib/components/CodeEditor.svelte` with:**
```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { EditorView, basicSetup } from 'codemirror';
  import { EditorState } from '@codemirror/state';
  import { keymap } from '@codemirror/view';
  import { indentWithTab } from '@codemirror/commands';
  import { python } from '@codemirror/lang-python';
  import { oneDark } from '@codemirror/theme-one-dark';

  let { value = $bindable('') } = $props();
  let host;
  let view;
  let applyingExternal = false;

  const hostTheme = EditorView.theme({
    '&': { borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-hairline)', fontSize: '14px' },
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
          python(),
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
```

- [ ] **Step 3: Verify** — `npm run build` (must succeed; the bundle grows — that's expected) and `npm test` (all pass).

- [ ] **Step 4: Commit**
```bash
git add package.json package-lock.json src/lib/components/CodeEditor.svelte
git commit -m "feat: CodeMirror 6 editor with Python highlighting"
```

---

## Task 4: Wire compare-your-solution into Practice

**Files:** Modify `src/lib/views/Practice.svelte`.

- [ ] **Step 1: Import SolutionDiff.** After `import CodeEditor from '../components/CodeEditor.svelte';` add:
```js
  import SolutionDiff from '../components/SolutionDiff.svelte';
```

- [ ] **Step 2: Add state.** Near the other `$state` declarations (after `let result = $state(null);`) add:
```js
  let submittedCode = $state('');
  let showCompare = $state(false);
```

- [ ] **Step 3: Reset compare on navigation.** In `resetForCurrent()`, add `showCompare = false; submittedCode = '';` to the existing reset line so it reads:
```js
  function resetForCurrent() {
    code = current?.starterCode ?? '';
    showHint = false; showSolution = false; usedHelp = false; result = null;
    showCompare = false; submittedCode = '';
  }
```

- [ ] **Step 4: Capture submitted code on pass.** In `run()`, immediately after `result = await runCode(pyodide, code, current.check);` add:
```js
      if (result.passed) submittedCode = code;
```
(The existing `if (result.passed) gradeOnce(true);` line stays right after.)

- [ ] **Step 5: Render the compare toggle + diff.** Inside the `{#if result}` block, after the closing `</div>` of `.result`, add:
```svelte
      {#if result.passed}
        <button class="btn-secondary" onclick={() => (showCompare = !showCompare)}>
          {showCompare ? 'Hide comparison' : 'Compare with model solution'}
        </button>
        {#if showCompare}
          <SolutionDiff userCode={submittedCode} solution={current.solution} />
        {/if}
      {/if}
```

- [ ] **Step 6: Verify** — `npm run build` (no errors/warnings) and `npm test` (all pass).

- [ ] **Step 7: Commit**
```bash
git add src/lib/views/Practice.svelte
git commit -m "feat: compare submitted code to model solution after a pass"
```

---

## Task 5: Update the browser smoke test (post-merge)

- [ ] **Step 1.** After merge + deploy, update `/tmp/smoke/test.mjs` so it sets the editor by typing into CodeMirror's contenteditable instead of `page.fill('textarea.editor', ...)`:
  - Click `.cm-content`, `await page.keyboard.press('Control+A')`, `await page.keyboard.press('Delete')`, then `await page.locator('.cm-content').first().pressSequentially(solution)` (or `page.keyboard.insertText(solution)`).
  - Run, wait for `.result`, assert "Passed".
  - Click "Compare with model solution", assert `.diff .row.add` count `>= 1`.
  This step verifies the live site; it does not block the merge.

---

## Self-Review
- **Spec coverage:** CodeMirror editor with Python highlighting + preserved bindable interface ✓ (T3); external-value sync ✓ (T3 `$effect`); line-diff helper ✓ (T1); SolutionDiff render ✓ (T2); Practice compare toggle capturing submitted code ✓ (T4); smoke verification ✓ (T5).
- **Placeholder scan:** none; all code is complete.
- **Type consistency:** `lineDiff(userCode, solution)` → `[{type,text}]` consumed by SolutionDiff; CodeEditor keeps `value=$bindable()`; `submittedCode`/`showCompare`/`current.solution` names consistent across Practice edits.
