const WEIGHT = { easy: 10, medium: 20, hard: 30 };

// Pure: derive XP / level / badges from the FSRS progress map + the catalogs.
// A card existing in `progress` means that exercise has been attempted (seen).
export function computeGamification({ progress, questions = [], sqlBank = [], lessons = [], streak = 0 }) {
  const seen = (id) => !!progress[id];
  let xp = 0, pySeen = 0, sqlSeen = 0, lessonSeen = 0;
  for (const q of questions) if (seen(q.id)) { xp += WEIGHT[q.difficulty] ?? 10; pySeen++; }
  for (const q of sqlBank) if (seen(q.id)) { xp += WEIGHT[q.difficulty] ?? 10; sqlSeen++; }
  for (const l of lessons) if (seen(l.id)) { xp += WEIGHT[l.difficulty] ?? 10; lessonSeen++; }
  const level = Math.floor(xp / 100) + 1;
  const total = pySeen + sqlSeen + lessonSeen;
  const badges = [
    { id: 'first', label: 'First Solve', desc: 'Complete your first exercise', earned: total >= 1 },
    { id: 'py10', label: 'Pythonista', desc: 'Solve 10 Python exercises', earned: pySeen >= 10 },
    { id: 'sql10', label: 'SQL Maestro', desc: 'Solve 10 SQL exercises', earned: sqlSeen >= 10 },
    { id: 'lessons10', label: 'Scholar', desc: 'Finish 10 lessons', earned: lessonSeen >= 10 },
    { id: 'streak3', label: 'Dedicated', desc: 'Reach a 3-day streak', earned: streak >= 3 },
    { id: 'lvl5', label: 'Level 5', desc: 'Reach level 5', earned: level >= 5 },
  ];
  return { xp, level, xpIntoLevel: xp % 100, badges, total };
}
