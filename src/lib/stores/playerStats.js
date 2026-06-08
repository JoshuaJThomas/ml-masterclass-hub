import { loadBank } from '../bank/loadBank.js';
import { loadSqlBank } from '../sql/loadSqlBank.js';
import { loadLessons } from '../lessons/loadLessons.js';
import { loadProgress } from '../srs/progress.js';
import { loadActivity, currentStreak } from '../srs/activity.js';
import { computeGamification } from '../stats/gamification.js';

// Load the player's streak + XP/level once, for the header context bar.
// Resilient: streak comes from local activity (cheap); if any bank fails to
// load we still return what we have rather than throwing.
export async function loadPlayerStats(base = import.meta.env.BASE_URL, now = new Date()) {
  const progress = loadProgress();
  const streak = currentStreak(loadActivity(), now);
  let questions = [], sqlBank = [], lessons = [];
  try { ({ questions } = await loadBank(base)); } catch { /* bank optional */ }
  try { sqlBank = await loadSqlBank(base); } catch { /* sql optional */ }
  try { lessons = await loadLessons(base); } catch { /* lessons optional */ }
  const game = computeGamification({ progress, questions, sqlBank, lessons, streak });
  return { streak, xp: game.xp, level: game.level, xpIntoLevel: game.xpIntoLevel };
}
