import { describe, it, expect } from 'vitest';
import { computeGamification } from './gamification.js';

const questions = [
  { id: 'ch01-a', difficulty: 'easy' }, { id: 'ch01-b', difficulty: 'hard' }, { id: 'ch02-c', difficulty: 'medium' },
];
const sqlBank = [{ id: 'sql01-a', difficulty: 'easy' }];
const lessons = [{ id: 'lesson-ch01-01', difficulty: 'easy' }];

describe('computeGamification', () => {
  it('sums XP by difficulty for seen cards', () => {
    const progress = { 'ch01-a': {}, 'ch01-b': {} }; // easy(10)+hard(30)=40
    const g = computeGamification({ progress, questions, sqlBank, lessons, streak: 0 });
    expect(g.xp).toBe(40);
    expect(g.level).toBe(1);
  });
  it('levels up every 100 xp', () => {
    const progress = {};
    for (const q of questions) progress[q.id] = {}; // 10+30+20 = 60
    for (const s of sqlBank) progress[s.id] = {}; // +10 = 70
    for (const l of lessons) progress[l.id] = {}; // +10 = 80
    const g = computeGamification({ progress, questions, sqlBank, lessons, streak: 5 });
    expect(g.xp).toBe(80);
    expect(g.level).toBe(1);
    expect(g.badges.find((b) => b.id === 'first').earned).toBe(true);
    expect(g.badges.find((b) => b.id === 'streak3').earned).toBe(true);
  });
  it('awards Pythonista at 10 python solves', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: 'ch01-' + i, difficulty: 'easy' }));
    const progress = Object.fromEntries(many.map((q) => [q.id, {}]));
    const g = computeGamification({ progress, questions: many, sqlBank: [], lessons: [], streak: 0 });
    expect(g.badges.find((b) => b.id === 'py10').earned).toBe(true);
  });
});
