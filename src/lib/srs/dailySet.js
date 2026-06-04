import { isDue } from './scheduler.js';

// Build today's practice set: due (seen & due) + fresh (unseen, older chapters first).
export function buildDailySet(questions, completedThrough, progress, now = new Date(), newLimit = 5) {
  const inScope = questions.filter((q) => q.chapter <= completedThrough);

  const due = inScope.filter((q) => progress[q.id] && isDue(progress[q.id], now));

  const fresh = inScope
    .filter((q) => !progress[q.id])
    .sort((a, b) => a.chapter - b.chapter || a.id.localeCompare(b.id))
    .slice(0, newLimit);

  return { due, fresh, all: [...due, ...fresh] };
}
