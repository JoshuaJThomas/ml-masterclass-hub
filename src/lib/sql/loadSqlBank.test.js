import { describe, it, expect, vi } from 'vitest';
import { loadSqlBank } from './loadSqlBank.js';
describe('loadSqlBank', () => {
  it('fetches sql.json under base', async () => {
    const data = [{ id: 'sql01-x' }];
    const f = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(data) }));
    expect(await loadSqlBank('/b/', f)).toEqual(data);
    expect(f).toHaveBeenCalledWith('/b/bank/sql.json');
  });
  it('throws on a bad response', async () => {
    const f = vi.fn(() => Promise.resolve({ ok: false, status: 500 }));
    await expect(loadSqlBank('/b/', f)).rejects.toThrow(/sql/i);
  });
});
