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
