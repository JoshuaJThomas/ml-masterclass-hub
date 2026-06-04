import { SEED_SQL } from './seed.js';

const SQLJS_VERSION = '1.13.0';
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/sql.js/${SQLJS_VERSION}/`;

let dbPromise = null;

// Lazily load sql.js (SQLite in WebAssembly) and seed a fresh in-memory DB.
export function getDb(onStatus = () => {}) {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    onStatus('Loading SQL engine…');
    if (!window.initSqlJs) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = `${CDN}sql-wasm.js`;
        s.onload = resolve;
        s.onerror = () => reject(new Error('Failed to load sql.js'));
        document.head.appendChild(s);
      });
    }
    const SQL = await window.initSqlJs({ locateFile: (f) => `${CDN}${f}` });
    const db = new SQL.Database();
    db.run(SEED_SQL);
    onStatus('');
    return db;
  })();
  return dbPromise;
}

// Run a query; return { columns, rows } or throw (caller catches to { error }).
export function runQuery(db, sql) {
  const res = db.exec(sql); // array of { columns, values }
  if (!res.length) return { columns: [], rows: [] };
  return { columns: res[0].columns, rows: res[0].values };
}

function norm(cell) {
  if (typeof cell === 'number') return Math.round(cell * 1e4) / 1e4;
  return cell;
}
const rowKey = (r) => JSON.stringify(r.map(norm));

// Pure: compare an expected result block to an actual { columns, rows }.
export function compareResults(expected, actual) {
  if (!actual || actual.error) return { passed: false, reason: actual?.error || 'no result' };
  if (expected.columns.length !== actual.columns.length) {
    return { passed: false, reason: 'wrong number of columns' };
  }
  for (let i = 0; i < expected.columns.length; i++) {
    if (expected.columns[i] !== actual.columns[i]) {
      return { passed: false, reason: `expected column "${expected.columns[i]}"` };
    }
  }
  if (expected.rows.length !== actual.rows.length) {
    return { passed: false, reason: `expected ${expected.rows.length} rows, got ${actual.rows.length}` };
  }
  if (expected.ordered) {
    for (let i = 0; i < expected.rows.length; i++) {
      if (rowKey(expected.rows[i]) !== rowKey(actual.rows[i])) {
        return { passed: false, reason: 'rows are in the wrong order' };
      }
    }
    return { passed: true, reason: '' };
  }
  const want = expected.rows.map(rowKey).sort();
  const got = actual.rows.map(rowKey).sort();
  for (let i = 0; i < want.length; i++) {
    if (want[i] !== got[i]) return { passed: false, reason: 'rows do not match' };
  }
  return { passed: true, reason: '' };
}
