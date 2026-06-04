import { describe, it, expect } from 'vitest';
import { buildDailySet } from './dailySet.js';

const now = new Date('2026-06-10T00:00:00Z');
const past = new Date('2026-06-01T00:00:00Z').toISOString();
const future = new Date('2026-06-20T00:00:00Z').toISOString();

const questions = [
  { id: 'ch01-a-01', chapter: 1 },
  { id: 'ch01-b-02', chapter: 1 },
  { id: 'ch03-c-01', chapter: 3 },
  { id: 'ch05-d-01', chapter: 5 },
  { id: 'ch09-e-01', chapter: 9 },
];

describe('buildDailySet', () => {
  it('includes seen cards that are due, excludes not-yet-due', () => {
    const progress = {
      'ch01-a-01': { due: past },
      'ch03-c-01': { due: future },
    };
    const { due } = buildDailySet(questions, 8, progress, now, 5);
    expect(due.map((q) => q.id)).toEqual(['ch01-a-01']);
  });

  it('new cards are unseen, in scope, older chapters first, capped at newLimit', () => {
    const { fresh } = buildDailySet(questions, 8, {}, now, 2);
    expect(fresh.map((q) => q.id)).toEqual(['ch01-a-01', 'ch01-b-02']);
  });

  it('never includes chapters beyond completedThrough', () => {
    const { all } = buildDailySet(questions, 8, {}, now, 99);
    expect(all.some((q) => q.chapter > 8)).toBe(false);
  });

  it('all = due then fresh, no duplicates', () => {
    const progress = { 'ch01-a-01': { due: past } };
    const { all } = buildDailySet(questions, 8, progress, now, 5);
    const ids = all.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('ch01-a-01');
  });
});
