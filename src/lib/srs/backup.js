import { loadProgress } from './progress.js';
import { loadActivity } from './activity.js';

const PROGRESS_KEY = 'mlhub.progress.v1';
const ACTIVITY_KEY = 'mlhub.activity.v1';

function getStore(storage) {
  return storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
}

// Bundle progress + activity into a portable, downloadable object.
export function exportData(storage) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: loadProgress(storage),
    activity: loadActivity(storage),
  };
}

// Restore a previously exported bundle into storage. Returns { ok, error }.
export function importData(obj, storage) {
  const store = getStore(storage);
  if (!store) return { ok: false, error: 'storage unavailable' };
  if (!obj || typeof obj !== 'object' || typeof obj.progress !== 'object') {
    return { ok: false, error: 'invalid backup file' };
  }
  store.setItem(PROGRESS_KEY, JSON.stringify(obj.progress || {}));
  store.setItem(ACTIVITY_KEY, JSON.stringify(obj.activity || {}));
  return { ok: true };
}
