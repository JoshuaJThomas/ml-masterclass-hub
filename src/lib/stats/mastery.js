// FSRS State 2 === Review === "mastered" for our purposes.
const MASTERED = 2;

export function chapterMastery(questions, progress, completedThrough) {
  const rows = [];
  for (let ch = 1; ch <= completedThrough; ch++) {
    const inCh = questions.filter((q) => q.chapter === ch);
    if (!inCh.length) continue;
    const seen = inCh.filter((q) => progress[q.id]).length;
    const known = inCh.filter((q) => progress[q.id]?.state === MASTERED).length;
    rows.push({ chapter: ch, total: inCh.length, seen, known });
  }
  return rows;
}

export function summarize(questions, progress, completedThrough) {
  const inScope = questions.filter((q) => q.chapter <= completedThrough);
  const seen = inScope.filter((q) => progress[q.id]).length;
  const known = inScope.filter((q) => progress[q.id]?.state === MASTERED).length;
  return { total: inScope.length, seen, known };
}
