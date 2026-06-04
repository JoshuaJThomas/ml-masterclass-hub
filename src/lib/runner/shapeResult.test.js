import { describe, it, expect } from 'vitest';
import { shapeResult } from './pyodideRunner.js';

describe('shapeResult', () => {
  it('reports pass when no error', () => {
    expect(shapeResult('out\n', null)).toEqual({ passed: true, stdout: 'out\n', error: null });
  });
  it('reports fail and extracts an AssertionError message', () => {
    const r = shapeResult('', new Error('Traceback...\nAssertionError: nope'));
    expect(r.passed).toBe(false);
    expect(r.error).toMatch(/AssertionError/);
  });
  it('treats a bare assertion (no message) as a failed check', () => {
    const r = shapeResult('', new Error('AssertionError'));
    expect(r.passed).toBe(false);
  });
});
