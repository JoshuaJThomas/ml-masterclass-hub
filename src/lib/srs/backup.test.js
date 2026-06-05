import { describe, it, expect } from 'vitest';
import { exportData, importData } from './backup.js';
import { loadProgress } from './progress.js';

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
}

describe('backup', () => {
  it('exports progress + activity with a version', () => {
    const s = fakeStorage({ 'mlhub.progress.v1': JSON.stringify({ a: 1 }), 'mlhub.activity.v1': JSON.stringify({ '2026-06-05': 2 }) });
    const out = exportData(s);
    expect(out.version).toBe(1);
    expect(out.progress).toEqual({ a: 1 });
    expect(out.activity).toEqual({ '2026-06-05': 2 });
    expect(typeof out.exportedAt).toBe('string');
  });

  it('imports a bundle back into storage', () => {
    const s = fakeStorage();
    const r = importData({ version: 1, progress: { x: 9 }, activity: { d: 1 } }, s);
    expect(r.ok).toBe(true);
    expect(loadProgress(s)).toEqual({ x: 9 });
  });

  it('rejects an invalid bundle', () => {
    const s = fakeStorage();
    expect(importData(null, s).ok).toBe(false);
    expect(importData({ nope: true }, s).ok).toBe(false);
  });
});
