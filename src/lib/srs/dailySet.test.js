import { describe, it, expect } from 'vitest';
import { buildDailySet } from './dailySet.js';

const now = new Date('2026-06-10T00:00:00Z');
const other = new Date('2026-06-11T00:00:00Z');
const past = new Date('2026-06-01T00:00:00Z').toISOString();
const future = new Date('2026-06-20T00:00:00Z').toISOString();

// 6 chapters x 3 unseen exercises each.
const questions = [];
for (let ch = 1; ch <= 6; ch++) {
  for (let i = 1; i <= 3; i++) questions.push({ id: `ch${String(ch).padStart(2, '0')}-t-0${i}`, chapter: ch });
}

describe('buildDailySet', () => {
  it('includes seen cards that are due, excludes not-yet-due', () => {
    const progress = { 'ch01-t-01': { due: past }, 'ch03-t-01': { due: future } };
    const { due } = buildDailySet(questions, 6, progress, now, 5);
    expect(due.map((q) => q.id)).toEqual(['ch01-t-01']);
  });

  it('fresh = newLimit unseen cards, interleaved across distinct chapters (non-linear)', () => {
    const { fresh } = buildDailySet(questions, 6, {}, now, 5);
    expect(fresh).toHaveLength(5);
    // one per chapter via round-robin => 5 distinct chapters, not all from ch01
    expect(new Set(fresh.map((q) => q.chapter)).size).toBe(5);
    expect(fresh.every((q) => q.chapter <= 6)).toBe(true);
  });

  it('is deterministic within a day but differs across days', () => {
    const a = buildDailySet(questions, 6, {}, now, 5).fresh.map((q) => q.id);
    const b = buildDailySet(questions, 6, {}, now, 5).fresh.map((q) => q.id);
    const c = buildDailySet(questions, 6, {}, other, 5).fresh.map((q) => q.id);
    expect(a).toEqual(b);
    expect(a.join()).not.toEqual(c.join());
  });

  it('never includes chapters beyond completedThrough', () => {
    const { all } = buildDailySet(questions, 2, {}, now, 99);
    expect(all.some((q) => q.chapter > 2)).toBe(false);
  });

  it('all = due then fresh, no duplicates', () => {
    const progress = { 'ch01-t-01': { due: past } };
    const { all } = buildDailySet(questions, 6, progress, now, 5);
    const ids = all.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('ch01-t-01');
  });

  it('caps at the number available when fewer than newLimit', () => {
    // only chapter 1 in scope => 3 unseen
    expect(buildDailySet(questions, 1, {}, now, 5).fresh).toHaveLength(3);
  });
});
