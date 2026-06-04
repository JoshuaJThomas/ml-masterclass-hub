const DIFF = ['easy', 'medium', 'hard'];
const NONEMPTY = ['topic', 'prompt', 'starterQuery', 'solution'];

export function validateSqlBank(questions) {
  const errors = [];
  if (!Array.isArray(questions)) return { valid: false, errors: ['bank must be an array'] };
  const seen = new Set();
  for (const q of questions) {
    const where = q?.id ? `[${q.id}]` : '[<no id>]';
    if (typeof q?.id !== 'string' || !/^sql\d{2}-/.test(q.id)) errors.push(`${where} id must match sql<NN>-`);
    if (seen.has(q.id)) errors.push(`${where} duplicate id`);
    seen.add(q.id);
    if (!Number.isInteger(q.tier) || q.tier < 1) errors.push(`${where} tier must be an integer >= 1`);
    for (const f of NONEMPTY) if (typeof q[f] !== 'string' || !q[f].trim()) errors.push(`${where} ${f} required`);
    if (!q.expected || !Array.isArray(q.expected.columns) || !Array.isArray(q.expected.rows)) {
      errors.push(`${where} expected.{columns,rows} required`);
    }
    if (!DIFF.includes(q.difficulty)) errors.push(`${where} difficulty invalid`);
  }
  return { valid: errors.length === 0, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import('node:fs');
  const bank = JSON.parse(readFileSync('public/bank/sql.json', 'utf8'));
  const { valid, errors } = validateSqlBank(bank);
  if (!valid) { console.error('SQL bank invalid:'); errors.forEach((e) => console.error('  - ' + e)); process.exit(1); }
  console.log(`SQL bank valid: ${bank.length} questions.`);
}
