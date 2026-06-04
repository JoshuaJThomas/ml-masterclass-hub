const DIFFICULTIES = ['easy', 'medium', 'hard'];
const NONEMPTY = ['topic', 'prompt', 'check', 'solution'];

export function validateBank(meta, questions) {
  const errors = [];

  if (!Number.isInteger(meta?.completedThrough) || meta.completedThrough < 0) {
    errors.push('meta.completedThrough must be an integer >= 0');
  }
  if (!Number.isInteger(meta?.currentChapter) || meta.currentChapter < 0) {
    errors.push('meta.currentChapter must be an integer >= 0');
  }
  if (typeof meta?.generatedAt !== 'string' || !meta.generatedAt) {
    errors.push('meta.generatedAt must be a non-empty string');
  }

  if (!Array.isArray(questions)) {
    errors.push('questions must be an array');
    return { valid: false, errors };
  }

  const seen = new Set();
  for (const q of questions) {
    const where = q?.id ? `[${q.id}]` : '[<no id>]';
    if (typeof q?.id !== 'string' || !q.id) {
      errors.push(`${where} id must be a non-empty string`);
      continue;
    }
    if (seen.has(q.id)) errors.push(`${where} duplicate id`);
    seen.add(q.id);

    if (!Number.isInteger(q.chapter) || q.chapter < 0) {
      errors.push(`${where} chapter must be an integer >= 0`);
    } else {
      const prefix = `ch${String(q.chapter).padStart(2, '0')}-`;
      if (!q.id.startsWith(prefix)) {
        errors.push(`${where} id prefix must be "${prefix}" to match chapter ${q.chapter}`);
      }
    }

    for (const field of NONEMPTY) {
      if (typeof q[field] !== 'string' || !q[field].trim()) {
        errors.push(`${where} ${field} must be a non-empty string`);
      }
    }
    if (typeof q.starterCode !== 'string') errors.push(`${where} starterCode must be a string`);
    if (typeof q.hint !== 'string') errors.push(`${where} hint must be a string`);
    if (!DIFFICULTIES.includes(q.difficulty)) {
      errors.push(`${where} difficulty must be one of ${DIFFICULTIES.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// CLI: validate the real bank files; exit non-zero on failure.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import('node:fs');
  const meta = JSON.parse(readFileSync('public/bank/meta.json', 'utf8'));
  const questions = JSON.parse(readFileSync('public/bank/questions.json', 'utf8'));
  const { valid, errors } = validateBank(meta, questions);
  if (!valid) {
    console.error(`Bank invalid (${errors.length} errors):`);
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
  const chapters = questions.map((q) => q.chapter);
  const range = chapters.length ? `${Math.min(...chapters)}-${Math.max(...chapters)}` : 'none';
  console.log(`Bank valid: ${questions.length} questions across chapters ${range}.`);
}
