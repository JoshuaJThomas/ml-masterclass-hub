import { describe, it, expect } from 'vitest';
import { selectDaily } from './selectDaily.js';

const bank = [];
for (let ch = 1; ch <= 10; ch++) {
  for (let i = 1; i <= 3; i++) bank.push({ id: `ch${String(ch).padStart(2,'0')}-t-0${i}`, chapter: ch });
}

describe('selectDaily', () => {
  it('only includes chapters <= completedThrough', () => {
    const picked = selectDaily(bank, 5, '2026-06-04', 5);
    expect(picked.every((q) => q.chapter <= 5)).toBe(true);
  });

  it('returns exactly n items when enough are in scope', () => {
    expect(selectDaily(bank, 8, '2026-06-04', 5)).toHaveLength(5);
  });

  it('is deterministic for the same date', () => {
    const a = selectDaily(bank, 8, '2026-06-04', 5).map((q) => q.id);
    const b = selectDaily(bank, 8, '2026-06-04', 5).map((q) => q.id);
    expect(a).toEqual(b);
  });

  it('differs across dates (usually)', () => {
    const a = selectDaily(bank, 8, '2026-06-04', 5).map((q) => q.id).join();
    const b = selectDaily(bank, 8, '2026-06-05', 5).map((q) => q.id).join();
    expect(a).not.toEqual(b);
  });

  it('returns no duplicates', () => {
    const ids = selectDaily(bank, 8, '2026-06-04', 5).map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('caps at the number available when fewer than n', () => {
    expect(selectDaily(bank, 1, '2026-06-04', 5)).toHaveLength(3);
  });
});
