import { describe, it, expect } from 'vitest';
import { loadActivity, logReview, currentStreak } from './activity.js';

function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
}

describe('activity', () => {
  it('logs and counts reviews per day', () => {
    const s = fakeStorage();
    logReview('2026-06-04', s);
    const a = logReview('2026-06-04', s);
    expect(a['2026-06-04']).toBe(2);
    expect(loadActivity(s)['2026-06-04']).toBe(2);
  });

  it('counts a consecutive streak ending today', () => {
    const a = { '2026-06-02': 1, '2026-06-03': 2, '2026-06-04': 1 };
    expect(currentStreak(a, new Date('2026-06-04T12:00:00Z'))).toBe(3);
  });

  it('still counts a streak when today has no activity yet (grace via yesterday)', () => {
    const a = { '2026-06-02': 1, '2026-06-03': 1 };
    expect(currentStreak(a, new Date('2026-06-04T12:00:00Z'))).toBe(2);
  });

  it('breaks the streak on a gap', () => {
    const a = { '2026-06-01': 1, '2026-06-04': 1 };
    expect(currentStreak(a, new Date('2026-06-04T12:00:00Z'))).toBe(1);
  });

  it('is zero with no recent activity', () => {
    expect(currentStreak({}, new Date('2026-06-04T12:00:00Z'))).toBe(0);
  });
});
