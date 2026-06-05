import { isDue } from './scheduler.js';

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build today's practice set: due (seen & due) + fresh (unseen). New cards are
// INTERLEAVED across chapters in a date-seeded random order (non-linear), so you
// aren't forced through chapters strictly 1→2→3. Deterministic within a given day.
export function buildDailySet(questions, completedThrough, progress, now = new Date(), newLimit = 5) {
  const inScope = questions.filter((q) => q.chapter <= completedThrough);

  const due = inScope.filter((q) => progress[q.id] && isDue(progress[q.id], now));

  // Group the unseen exercises by chapter (stable id order within a chapter).
  const byChapter = new Map();
  for (const q of inScope) {
    if (progress[q.id]) continue;
    if (!byChapter.has(q.chapter)) byChapter.set(q.chapter, []);
    byChapter.get(q.chapter).push(q);
  }
  for (const list of byChapter.values()) list.sort((a, b) => a.id.localeCompare(b.id));

  // Random chapter visitation order (seeded by the date), then round-robin one per
  // chapter — this spreads new cards across chapters instead of going oldest-first.
  const rand = mulberry32(hashString(now.toISOString().slice(0, 10)));
  const chapters = seededShuffle([...byChapter.keys()], rand);
  const fresh = [];
  let progressed = true;
  while (fresh.length < newLimit && progressed) {
    progressed = false;
    for (const ch of chapters) {
      const list = byChapter.get(ch);
      if (list.length) {
        fresh.push(list.shift());
        progressed = true;
        if (fresh.length >= newLimit) break;
      }
    }
  }

  return { due, fresh, all: [...due, ...fresh] };
}
