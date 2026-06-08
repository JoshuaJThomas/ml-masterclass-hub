// Replaces the ml-hub-BUILD placeholder in dist/sw.js with a UTC timestamp,
// ensuring each production build gets a unique cache name so old stale assets
// are evicted when the service worker activates after a deploy.
import { readFileSync, writeFileSync } from 'fs';

const path = 'dist/sw.js';
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHmmss
const src = readFileSync(path, 'utf8');
const patched = src.replaceAll('ml-hub-BUILD', `ml-hub-${ts}`);
if (patched === src) {
  console.error('patch-sw: placeholder ml-hub-BUILD not found in dist/sw.js');
  process.exit(1);
}
writeFileSync(path, patched, 'utf8');
console.log(`patch-sw: cache versioned as ml-hub-${ts}`);
