import { writable } from 'svelte/store';

const KEY = 'mlhub.view.v1';
const VALID = new Set(['learn', 'practice', 'sql', 'library', 'progress']);

function readStored() {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return VALID.has(v) ? v : 'practice';
  } catch {
    return 'practice';
  }
}

export const view = writable(readStored());

view.subscribe(v => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, v);
  } catch {}
});
