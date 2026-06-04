import { describe, it, expect } from 'vitest';
import { validateSqlBank } from './validate-sql-bank.js';

const good = { id: 'sql01-x', tier: 1, topic: 't', prompt: 'p', starterQuery: 'SELECT', solution: 'SELECT 1', difficulty: 'easy', expected: { columns: ['a'], rows: [[1]], ordered: false } };
describe('validateSqlBank', () => {
  it('accepts a good bank', () => expect(validateSqlBank([good]).valid).toBe(true));
  it('rejects a bad id', () => expect(validateSqlBank([{ ...good, id: 'x' }]).valid).toBe(false));
  it('rejects a duplicate id', () => expect(validateSqlBank([good, { ...good }]).valid).toBe(false));
  it('rejects a missing expected', () => expect(validateSqlBank([{ ...good, expected: undefined }]).valid).toBe(false));
});
