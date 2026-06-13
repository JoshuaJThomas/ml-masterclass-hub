import { buildDailySet } from './dailySet.js';

// 3-act session builder (DIRECTION.md §1, binding spec).
//
//   Act 1 — Warm-up: EXACTLY 4 items, ordered 1 easy due review FIRST (success-first
//           momentum), then due-before-fresh, ascending difficulty.
//   Act 2 — Core: EXACTLY 1 item, current-chapter, hardest in the set. Skippable on
//           mobile without forfeiting "done for today".
//   Act 3 — Cool-down: 1 ungraded free-text self-explanation prompt (no schema change).
//
// Cap = 5 GRADED items per session (warm-up ≤4 + core 1). Overflow due cards wait for
// tomorrow. The core is excluded from the warm-up so it isn't graded twice.
//
// NOTE (deferred, DIRECTION.md §1): the medium→hard core promotion gate ("promote only
// after TWO consecutive sessions solving the core without revealing") needs a small piece
// of persisted session history; it's a follow-up. Today the core is simply the hardest
// current-chapter item available.

const DIFF_RANK = { easy: 0, medium: 1, hard: 2 };
const rank = (q) => DIFF_RANK[q?.difficulty] ?? 1;
const byDiffAscId = (a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id);
const byDiffDescId = (a, b) => rank(b) - rank(a) || a.id.localeCompare(b.id);

export const COOLDOWN_PROMPT = 'In one sentence, why did this work?';
export const WARMUP_TARGET = 4;
export const GRADED_CAP = 5;

export function buildSession(questions, currentChapter, progress, now = new Date()) {
  // Pull more than the cap so we can shape acts, then enforce the cap on graded output.
  const { due, fresh } = buildDailySet(questions, currentChapter, progress, now, GRADED_CAP);

  // Core: hardest item at the CURRENT chapter that's in today's set; fall back to the
  // hardest item anywhere in the set, else none.
  const pool = [...due, ...fresh];
  const atCurrent = pool.filter((q) => q.chapter === currentChapter).sort(byDiffDescId);
  const core = atCurrent[0] ?? pool.slice().sort(byDiffDescId)[0] ?? null;

  // Warm-up: everything else, due-before-fresh, ascending difficulty. The easiest due
  // sits first (success-first). Exactly up to WARMUP_TARGET.
  const coreId = core?.id;
  const dueWarm = due.filter((q) => q.id !== coreId).sort(byDiffAscId);
  const freshWarm = fresh.filter((q) => q.id !== coreId).sort(byDiffAscId);
  const warmup = [...dueWarm, ...freshWarm].slice(0, WARMUP_TARGET);

  const graded = [...warmup, ...(core ? [core] : [])].slice(0, GRADED_CAP);
  // If the cap trimmed the core out (can't happen with WARMUP_TARGET 4 + cap 5, but be safe)
  const coreInGraded = core && graded.some((q) => q.id === core.id) ? core : null;

  const minutes = Math.max(5, Math.round(graded.length * 3.5) + 2);

  return {
    warmup,
    core: coreInGraded,
    graded,
    cooldown: { prompt: COOLDOWN_PROMPT },
    counts: { due: due.length, fresh: fresh.length, graded: graded.length, minutes },
    empty: graded.length === 0,
  };
}
