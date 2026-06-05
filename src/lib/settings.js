const KEY = 'mlhub.currentChapter';

function getStore(storage) {
  return storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
}

// The user's current chapter (how far they've learned). Falls back to the bank default.
export function getCurrentChapter(fallback, storage) {
  const store = getStore(storage);
  if (!store) return fallback;
  const v = parseInt(store.getItem(KEY), 10);
  return Number.isInteger(v) && v >= 1 ? v : fallback;
}

export function setCurrentChapter(n, storage) {
  const store = getStore(storage);
  if (store) store.setItem(KEY, String(n));
}
