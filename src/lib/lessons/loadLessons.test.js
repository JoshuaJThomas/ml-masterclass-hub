import { describe, it, expect, vi } from 'vitest';
import { loadLessons } from './loadLessons.js';
describe('loadLessons', () => {
  it('fetches lessons.json under base', async () => {
    const data = [{ id: 'lesson-ch01-01' }];
    const f = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(data) }));
    expect(await loadLessons('/b/', f)).toEqual(data);
    expect(f).toHaveBeenCalledWith('/b/bank/lessons.json');
  });
  it('throws on a bad response', async () => {
    const f = vi.fn(() => Promise.resolve({ ok: false, status: 404 }));
    await expect(loadLessons('/b/', f)).rejects.toThrow(/lesson/i);
  });
});
