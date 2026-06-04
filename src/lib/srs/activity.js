const KEY = 'mlhub.activity.v1';

function getStore(storage) {
  return storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
}

export function loadActivity(storage) {
  const store = getStore(storage);
  if (!store) return {};
  try {
    return JSON.parse(store.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

// Increment the review counter for a YYYY-MM-DD day. Returns the updated map.
export function logReview(dateStr, storage) {
  const store = getStore(storage);
  const map = loadActivity(storage);
  map[dateStr] = (map[dateStr] || 0) + 1;
  if (store) store.setItem(KEY, JSON.stringify(map));
  return map;
}

const dayKey = (d) => d.toISOString().slice(0, 10);

// Consecutive days with activity ending today (or yesterday, as grace for the current day).
export function currentStreak(activity, today = new Date()) {
  const cursor = new Date(today);
  if (!activity[dayKey(cursor)]) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (activity[dayKey(cursor)]) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
