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
