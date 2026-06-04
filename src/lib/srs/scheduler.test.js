import { describe, it, expect } from 'vitest';
import { newCard, grade, isDue, reviveCard, ratingFor, Rating } from './scheduler.js';

const t0 = new Date('2026-06-04T00:00:00Z');

describe('scheduler', () => {
  it('creates a new card that is due now', () => {
    const card = newCard(t0);
    expect(isDue(card, t0)).toBe(true);
  });

  it('grades Good to a later due date than Again', () => {
    const base = newCard(t0);
    const good = grade(base, Rating.Good, t0);
    const again = grade(base, Rating.Again, t0);
    expect(new Date(good.due) > new Date(again.due)).toBe(true);
  });

  it('survives a JSON round-trip and can still be graded', () => {
    const card = grade(newCard(t0), Rating.Good, t0);
    const restored = reviveCard(JSON.parse(JSON.stringify(card)));
    const next = grade(restored, Rating.Good, new Date('2026-06-05T00:00:00Z'));
    expect(next.reps).toBe(2);
  });

  it('maps outcomes to ratings', () => {
    expect(ratingFor({ passed: true, usedHelp: false })).toBe(Rating.Good);
    expect(ratingFor({ passed: true, usedHelp: true })).toBe(Rating.Hard);
    expect(ratingFor({ passed: false, usedHelp: false })).toBe(Rating.Again);
  });
});
