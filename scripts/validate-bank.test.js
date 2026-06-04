import { describe, it, expect } from 'vitest';
import { validateBank } from './validate-bank.js';

const goodMeta = { completedThrough: 8, currentChapter: 8, generatedAt: '2026-06-04' };
const goodQ = {
  id: 'ch03-pandas-groupby-01', chapter: 3, topic: 'pandas groupby',
  prompt: 'do x', starterCode: 'result = ...', check: 'assert result == 1',
  hint: 'think', solution: 'result = 1', difficulty: 'easy',
};

describe('validateBank', () => {
  it('accepts a well-formed bank', () => {
    const r = validateBank(goodMeta, [goodQ]);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('rejects a duplicate id', () => {
    const r = validateBank(goodMeta, [goodQ, { ...goodQ }]);
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/duplicate id/i);
  });

  it('rejects a bad difficulty', () => {
    const r = validateBank(goodMeta, [{ ...goodQ, difficulty: 'spicy' }]);
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/difficulty/i);
  });

  it('rejects an id whose prefix does not match its chapter', () => {
    const r = validateBank(goodMeta, [{ ...goodQ, id: 'ch99-x-01' }]);
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/id prefix/i);
  });

  it('rejects a non-integer chapter', () => {
    const r = validateBank(goodMeta, [{ ...goodQ, chapter: 3.5, id: 'ch03-x-02' }]);
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/chapter/i);
  });

  it('rejects missing meta.completedThrough', () => {
    const r = validateBank({ currentChapter: 8, generatedAt: '2026-06-04' }, [goodQ]);
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toMatch(/completedThrough/i);
  });
});
