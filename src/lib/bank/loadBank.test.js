import { describe, it, expect, vi } from 'vitest';
import { loadBank } from './loadBank.js';

describe('loadBank', () => {
  it('fetches meta and questions relative to base and returns them', async () => {
    const meta = { completedThrough: 8, currentChapter: 8, generatedAt: '2026-06-04' };
    const questions = [{ id: 'ch01-x-01', chapter: 1 }];
    const fetchMock = vi.fn((url) =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(url.includes('meta') ? meta : questions) })
    );
    const result = await loadBank('/base/', fetchMock);
    expect(fetchMock).toHaveBeenCalledWith('/base/bank/meta.json');
    expect(fetchMock).toHaveBeenCalledWith('/base/bank/questions.json');
    expect(result).toEqual({ meta, questions });
  });

  it('throws a helpful error when a fetch is not ok', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: false, status: 404 }));
    await expect(loadBank('/base/', fetchMock)).rejects.toThrow(/bank/i);
  });
});
