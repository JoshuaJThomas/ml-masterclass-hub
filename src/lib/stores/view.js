import { writable } from 'svelte/store';

// Overhaul IA (DIRECTION.md §2): three destinations + one full-screen mode.
// Destinations: Today (home) · Library (content) · You (progress).
// The Session is NOT a destination — it's a transient full-screen mode launched
// from Today, tracked separately so it can take over the whole viewport.

const KEY = 'mlhub.view.v1';
const VALID = new Set(['today', 'library', 'you']);

function readStored() {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return VALID.has(v) ? v : 'today';
  } catch {
    return 'today';
  }
}

export const view = writable(readStored());

view.subscribe((v) => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, v);
  } catch {}
});

// Transient full-screen session state. `data` holds the built 3-act session.
export const session = writable({ active: false, data: null });

export function startSession(data) {
  session.set({ active: true, data });
}
export function endSession() {
  session.set({ active: false, data: null });
}
