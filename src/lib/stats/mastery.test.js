import { describe, it, expect } from 'vitest';
import { chapterMastery, summarize } from './mastery.js';

// FSRS State: 0 New, 1 Learning, 2 Review (mastered), 3 Relearning.
const questions = [
  { id: 'ch01-a-01', chapter: 1 },
  { id: 'ch01-b-02', chapter: 1 },
  { id: 'ch02-c-01', chapter: 2 },
  { id: 'ch09-d-01', chapter: 9 },
];
const progress = {
  'ch01-a-01': { state: 2 },
  'ch01-b-02': { state: 1 },
};

describe('mastery', () => {
  it('reports per-chapter totals, seen, and known for completed chapters only', () => {
    const rows = chapterMastery(questions, progress, 8);
    expect(rows).toEqual([
      { chapter: 1, total: 2, seen: 2, known: 1 },
      { chapter: 2, total: 1, seen: 0, known: 0 },
    ]);
  });

  it('summarizes in-scope totals', () => {
    expect(summarize(questions, progress, 8)).toEqual({ total: 3, seen: 2, known: 1 });
  });
});
