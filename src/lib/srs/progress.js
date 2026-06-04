const KEY = 'mlhub.progress.v1';

function getStore(storage) {
  return storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
}

export function loadProgress(storage) {
  const store = getStore(storage);
  if (!store) return {};
  try {
    return JSON.parse(store.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function saveProgress(map, storage) {
  const store = getStore(storage);
  if (!store) return;
  store.setItem(KEY, JSON.stringify(map));
}

export function recordReview(id, card, storage) {
  const map = loadProgress(storage);
  map[id] = card;
  saveProgress(map, storage);
  return map;
}
