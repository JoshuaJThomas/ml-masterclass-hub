import { describe, it, expect } from 'vitest';
import { buildSession, WARMUP_TARGET, GRADED_CAP } from './session.js';

// Minimal question factory.
let n = 0;
const q = (chapter, difficulty, id) => ({
  id: id ?? `ch${String(chapter).padStart(2, '0')}-q${n++}`,
  chapter,
  difficulty,
  topic: 't',
  prompt: 'p',
});

describe('buildSession (3-act)', () => {
  it('returns at most 4 warm-up and exactly 1 core, capped at 5 graded', () => {
    const questions = [
      q(8, 'easy'), q(8, 'easy'), q(8, 'medium'), q(8, 'medium'),
      q(8, 'hard'), q(8, 'hard'), q(8, 'medium'),
    ];
    const s = buildSession(questions, 8, {}, new Date('2026-06-13'));
    expect(s.warmup.length).toBeLessThanOrEqual(WARMUP_TARGET);
    expect(s.core).toBeTruthy();
    expect(s.graded.length).toBeLessThanOrEqual(GRADED_CAP);
    // core is not also in warm-up
    expect(s.warmup.some((w) => w.id === s.core.id)).toBe(false);
  });

  it('core is the hardest current-chapter item in the set', () => {
    const questions = [q(8, 'easy'), q(8, 'medium'), q(8, 'hard')];
    const s = buildSession(questions, 8, {}, new Date('2026-06-13'));
    expect(s.core.difficulty).toBe('hard');
  });

  it('warm-up is ascending difficulty (easiest first for success-first momentum)', () => {
    const questions = [q(8, 'hard'), q(8, 'easy'), q(8, 'medium'), q(8, 'easy'), q(8, 'medium')];
    const s = buildSession(questions, 8, {}, new Date('2026-06-13'));
    const ranks = s.warmup.map((w) => ({ easy: 0, medium: 1, hard: 2 }[w.difficulty]));
    const sorted = [...ranks].sort((a, b) => a - b);
    expect(ranks).toEqual(sorted);
  });

  it('reports empty when nothing is due or fresh in scope', () => {
    const s = buildSession([q(20, 'easy')], 8, {}, new Date('2026-06-13'));
    expect(s.empty).toBe(true);
    expect(s.graded.length).toBe(0);
  });

  it('provides an ungraded cool-down prompt and a minute estimate', () => {
    const s = buildSession([q(8, 'easy'), q(8, 'hard')], 8, {}, new Date('2026-06-13'));
    expect(s.cooldown.prompt).toMatch(/why/i);
    expect(s.counts.minutes).toBeGreaterThan(0);
  });
});
