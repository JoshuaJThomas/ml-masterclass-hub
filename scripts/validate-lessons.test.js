import { describe, it, expect } from 'vitest';
import { validateLessons } from './validate-lessons.js';
const good = { id: 'lesson-ch01-01', chapter: 1, order: 1, title: 'T', topic: 't', content: '# hi', prompt: 'p', starterCode: 'x=1', check: 'assert x==1', hint: 'h', solution: 'x=1', difficulty: 'easy' };
describe('validateLessons', () => {
  it('accepts a good lesson', () => expect(validateLessons([good]).valid).toBe(true));
  it('rejects a bad id', () => expect(validateLessons([{ ...good, id: 'x' }]).valid).toBe(false));
  it('rejects empty content', () => expect(validateLessons([{ ...good, content: '' }]).valid).toBe(false));
  it('rejects a duplicate id', () => expect(validateLessons([good, { ...good }]).valid).toBe(false));
});
