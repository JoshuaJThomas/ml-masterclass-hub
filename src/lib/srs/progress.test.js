import { describe, it, expect } from 'vitest';
import { loadProgress, saveProgress, recordReview } from './progress.js';

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  };
}

describe('progress', () => {
  it('returns {} when nothing stored', () => {
    expect(loadProgress(fakeStorage())).toEqual({});
  });

  it('saves and loads a map', () => {
    const s = fakeStorage();
    saveProgress({ 'ch01-x-01': { reps: 1 } }, s);
    expect(loadProgress(s)).toEqual({ 'ch01-x-01': { reps: 1 } });
  });

  it('recordReview merges one card and persists it', () => {
    const s = fakeStorage();
    recordReview('ch01-x-01', { reps: 1 }, s);
    const m = recordReview('ch02-y-02', { reps: 3 }, s);
    expect(Object.keys(m).sort()).toEqual(['ch01-x-01', 'ch02-y-02']);
    expect(loadProgress(s)['ch02-y-02']).toEqual({ reps: 3 });
  });

  it('returns {} on corrupt storage', () => {
    const s = { getItem: () => '{not json', setItem: () => {} };
    expect(loadProgress(s)).toEqual({});
  });
});
