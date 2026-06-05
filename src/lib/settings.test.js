import { describe, it, expect } from 'vitest';
import { getCurrentChapter, setCurrentChapter } from './settings.js';

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

describe('settings', () => {
  it('returns the fallback when nothing is stored', () => {
    expect(getCurrentChapter(8, fakeStorage())).toBe(8);
  });
  it('returns the stored override when set', () => {
    const s = fakeStorage();
    setCurrentChapter(5, s);
    expect(getCurrentChapter(8, s)).toBe(5);
  });
  it('ignores a junk stored value', () => {
    expect(getCurrentChapter(8, fakeStorage({ 'mlhub.currentChapter': 'abc' }))).toBe(8);
  });
});
