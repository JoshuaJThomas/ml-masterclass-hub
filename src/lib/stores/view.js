import { writable } from 'svelte/store';

// 'practice' | 'learn' | 'sql' | 'library' | 'progress'
export const view = writable('practice');
