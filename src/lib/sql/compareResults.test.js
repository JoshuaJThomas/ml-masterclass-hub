import { describe, it, expect } from 'vitest';
import { compareResults } from './sqlRunner.js';

const exp = { columns: ['name'], rows: [['Alice'], ['Bob']], ordered: false };

describe('compareResults', () => {
  it('passes when rows match ignoring order (unordered)', () => {
    expect(compareResults(exp, { columns: ['name'], rows: [['Bob'], ['Alice']] }).passed).toBe(true);
  });
  it('fails when a row is missing', () => {
    expect(compareResults(exp, { columns: ['name'], rows: [['Alice']] }).passed).toBe(false);
  });
  it('respects order when expected.ordered is true', () => {
    const o = { columns: ['name'], rows: [['Alice'], ['Bob']], ordered: true };
    expect(compareResults(o, { columns: ['name'], rows: [['Bob'], ['Alice']] }).passed).toBe(false);
    expect(compareResults(o, { columns: ['name'], rows: [['Alice'], ['Bob']] }).passed).toBe(true);
  });
  it('fails on column mismatch', () => {
    expect(compareResults(exp, { columns: ['id'], rows: [['Alice'], ['Bob']] }).passed).toBe(false);
  });
  it('rounds numeric cells before comparing', () => {
    const e = { columns: ['avg'], rows: [[62000.0]], ordered: false };
    expect(compareResults(e, { columns: ['avg'], rows: [[62000.00001]] }).passed).toBe(true);
  });
});
