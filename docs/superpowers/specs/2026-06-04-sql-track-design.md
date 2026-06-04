# SQL Practice Track — Design

**Date:** 2026-06-04
**Status:** Approved

## Goal
A real SQL practice track as a third "SQL" tab: write SQL against an in-browser SQLite
database, get checked against an expected result set, with the same FSRS spaced-repetition
engine and dashboard the Python track uses. Fully client-side / free.

## Decisions
- Its own **SQL tab** (nav: Practice · SQL · Progress).
- **Reuse FSRS** — SQL exercises are FSRS cards in the same `progress` store (ids never
  collide), so the streak and dashboard include SQL.

## Sample database (`src/lib/sql/seed.js`)
One fixed schema every exercise queries — `departments(id,name,budget)`,
`employees(id,name,dept_id,salary,hire_year)`, `sales(id,emp_id,amount,region)` — seeded
with a handful of rows. Enough for SELECT/WHERE/ORDER/LIMIT, aggregates/GROUP BY/HAVING,
JOINs, and subqueries. Exported as a single SQL string `SEED_SQL`.

## In-browser engine (`src/lib/sql/sqlRunner.js`)
- `getDb()` lazy-loads **sql.js 1.13.0** from CDN (`initSqlJs({locateFile})`), creates a DB,
  executes `SEED_SQL`, caches it.
- `runQuery(db, sql)` → `{columns, rows}` or throws → caller catches into `{error}`.
- **Pure** `compareResults(expected, actual)` → `{passed, reason}`: columns must match
  (by count + name); rows compared as a **multiset** (order-independent) unless
  `expected.ordered` is true (then exact order); numeric cells rounded to 4 dp before
  compare; nulls handled. Unit-tested in isolation (no wasm).

## SQL bank (`public/bank/sql.json`)
Array of `{id, tier (int), topic, prompt, starterQuery, expected:{columns,rows,ordered},
hint, solution, difficulty}`. `id` = `sql<NN>-<slug>`. `tier` (1–4) drives "easier first"
ordering when reused by `buildDailySet` (passed as the `chapter` arg).

**Content correctness:** a build script seeds Python's built-in `sqlite3`, runs each
exercise's `solution`, and **emits the `expected` block from the real query output** — so
`expected` always matches the solution. It also confirms each `starterQuery` is a runnable
stub. ~14 exercises tiered SELECT → WHERE/ORDER/LIMIT → aggregates/GROUP BY/HAVING → JOIN →
subquery. A JS validator (`scripts/validate-sql-bank.js` + test) checks the schema and is
wired into `npm test`.

## Reuse of the FSRS engine
The SQL view uses the existing `scheduler` (newCard/grade/ratingFor), `progress`
(loadProgress/recordReview), `activity` (logReview), and `buildDailySet` — called on the
SQL bank with a high `completedThrough` so all tiers are in scope, ordered by tier. SQL
card ids share the one `progress` map; `currentStreak` already spans both tracks.

## UI
- `view` store extended to `'practice' | 'sql' | 'progress'`; `Header` gains a SQL tab.
- `src/lib/views/Sql.svelte` mirrors `Practice.svelte`: SQL editor, Run, a **result table**
  of the user's output, on fail the **expected** table beside it, hint + reveal-solution,
  FSRS grading on first terminal outcome, due/new counts.
- `src/lib/components/ResultTable.svelte`: renders `{columns, rows}` as a styled table.
- `CodeEditor` gains a `lang` prop (`'python' | 'sql'`) using `@codemirror/lang-sql`.
- Dashboard gains a "SQL mastery" line via the existing `summarize()` over the SQL bank.

## Error handling
- sql.js load failure → friendly message; the rest of the app unaffected.
- Invalid user SQL → the SQLite error shown in the result panel (not a crash).
- Empty/over-large result sets render without breaking the table.

## Testing
- Unit: `compareResults` (ordered/unordered, column mismatch, float rounding, row mismatch);
  `validate-sql-bank`; `loadSqlBank` (mocked fetch).
- Content: Python `sqlite3` verifier (solution → expected) gates the bank.
- Browser smoke test: open SQL tab, type a solution, Run, assert "Passed" + a result table;
  confirm the dashboard's SQL mastery updates.

## Files
- Create: `src/lib/sql/seed.js`, `sqlRunner.js`, `loadSqlBank.js`; `public/bank/sql.json`;
  `scripts/validate-sql-bank.js`; `src/lib/components/ResultTable.svelte`;
  `src/lib/views/Sql.svelte`.
- Modify: `src/lib/components/CodeEditor.svelte` (lang prop), `src/lib/stores/view.js`,
  `src/lib/components/Header.svelte`, `src/App.svelte`, `src/lib/views/Progress.svelte`,
  `package.json`.
