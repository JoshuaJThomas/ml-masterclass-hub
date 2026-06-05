const DIFF = ['easy', 'medium', 'hard'];
const NONEMPTY = ['title', 'topic', 'content', 'prompt', 'check', 'solution'];

export function validateLessons(lessons) {
  const errors = [];
  if (!Array.isArray(lessons)) return { valid: false, errors: ['lessons must be an array'] };
  const seen = new Set();
  for (const l of lessons) {
    const where = l?.id ? `[${l.id}]` : '[<no id>]';
    if (typeof l?.id !== 'string' || !/^lesson-ch\d{2}-\d{2}$/.test(l.id)) errors.push(`${where} id must match lesson-ch<NN>-<NN>`);
    if (seen.has(l.id)) errors.push(`${where} duplicate id`);
    seen.add(l.id);
    if (!Number.isInteger(l.chapter) || l.chapter < 1) errors.push(`${where} chapter must be int >= 1`);
    if (!Number.isInteger(l.order)) errors.push(`${where} order must be an integer`);
    for (const f of NONEMPTY) if (typeof l[f] !== 'string' || !l[f].trim()) errors.push(`${where} ${f} required`);
    if (typeof l.starterCode !== 'string') errors.push(`${where} starterCode must be a string`);
    if (typeof l.hint !== 'string') errors.push(`${where} hint must be a string`);
    if (!DIFF.includes(l.difficulty)) errors.push(`${where} difficulty invalid`);
  }
  return { valid: errors.length === 0, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import('node:fs');
  const lessons = JSON.parse(readFileSync('public/bank/lessons.json', 'utf8'));
  const { valid, errors } = validateLessons(lessons);
  if (!valid) { console.error('Lessons invalid:'); errors.forEach((e) => console.error('  - ' + e)); process.exit(1); }
  console.log(`Lessons valid: ${lessons.length} across chapters ${Math.min(...lessons.map((l) => l.chapter))}-${Math.max(...lessons.map((l) => l.chapter))}.`);
}
