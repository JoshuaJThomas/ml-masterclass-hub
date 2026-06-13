# Overhaul Direction — committee synthesis (2026-06-13)

Committee: Dr. Maya Lindqvist (learning science) · Ciara O'Brien (Dublin DS hiring lead)
· Felix Tanaka (product design) · Ruth Adeyemi (frontend architecture). Chair: Claude.
Trigger: owner dislikes the current app "in every way — academically and design wise."

## Verdict in one line
The plumbing is excellent and stays; everything the owner sees and everything the
content asks of him gets replaced — a session-led app that trains the exact skills
Dublin data-analyst interviews test.

## 1. Philosophy (academic)
- **Criterion-task fidelity**: practice must look like the assessed task — pandas over
  messy real data, SQL with window functions/CTEs, metric-judgment, explaining outputs.
  Not factorials, not hand-rolling AdaBoost alphas.
- **Session, not card pile**: the daily unit is a ~20-min, 3-act session:
  warm-up retrieval → ONE substantial multi-step core task on a real
  dataset → ungraded "explain it" cool-down. Finishability is the product.
  **Exact spec (Lindqvist refinement, binding):**
  - Warm-up = exactly 4 items, ordered: 1 easy due review FIRST (success-first
    momentum), then due-before-fresh, ascending difficulty.
  - Core = exactly 1 item, current-chapter, hardest in the set. Promote a learner
    from medium→hard cores only after TWO consecutive sessions solving the core
    without revealing the solution.
  - Cool-down = 1 ungraded free-text self-explanation prompt ("In one sentence, why
    did this work?") shown alongside the existing SolutionDiff. Ungraded ⇒ no schema
    change ⇒ lands in **slice 2**, not slice 4. Session is 3-act from day one.
  - Cap = 5 graded items per session; overflow due cards wait for tomorrow.
  - **Mobile escape hatch (Tanaka refinement, binding):** the core task is
    skippable/deferrable ("finish on desktop") WITHOUT forfeiting "done for today."
    On a phone, finishability outranks rigor; rigor wins on a laptop.
- **Skill mastery over answer memory**: FSRS engine stays (ids frozen), but content
  grows toward several exercises per skill so reviews rotate variants instead of
  re-serving the identical assert.
- **Course relationship**: companion-plus-interview-layer to Portilla (lessons keyed to
  chapters, owner at ch 8); the practice layer trains what the course doesn't.

## 2. Information architecture
Three destinations + one mode. 5-tab parity dies.
- **Today** (home): "N reviews · M new · ~X min" card, ONE full-width Start button,
  quiet streak + this-week row. The 8am action is never ambiguous.
- **Session** (full-screen mode, no tabs): one item per screen, progress dots, editor +
  Run in thumb zone, ends on a completion screen.
- **Library**: browse/filter all lessons, Python and SQL exercises (SQL is content,
  not a destination).
- **You**: streak, heatmap, chapter mastery, current-chapter setting, backup.

## 3. Design language (replaces DESIGN.md / Cohere marketing skin)
- Dark-first OLED (`#0e0f12` base, `#16181d` raised), one accent, semantic green/red;
  ~10 color tokens total.
- Inter via @fontsource (no render-blocking imports); mono only in editor/output.
  Type scale 13/15/17/22/28; sentence case; the ALL-CAPS mono kicker dies.
- Spacing 4/8/12/16/24/32. Radius 12 cards / 8 controls. No pills, no hover-lift.
- Motion: transform/opacity only, ≤200ms, state changes only; one earned moment =
  daily-set completion. No per-question confetti.
- No emoji as iconography — minimal inline SVG set.
- Loading = skeletons, never "LOADING…". No `location.reload()` anywhere.
- **Keyboard handling (Tanaka, binding, the #1 Session detail):** on a 6.7" Android
  the IME eats half the viewport and CodeMirror scroll-jumps on focus. The Run button
  MUST stay pinned and visible ABOVE the open keyboard — use `visualViewport` /
  `interactive-widget=resizes-content`, NEVER `100vh`. If the user must dismiss the
  keyboard or scroll to find Run, the Session screen has failed. Verify on the actual
  Oppo Find X9 with keyboard open before calling slice 1 done.

## 4. Gamification
Anki psychology, not Duolingo: due-count pressure, quiet streak, finish line.
KILL XP/levels/badges/confetti. KEEP streak + heatmap (recast quietly in You).

## 5. Content direction (the academic fix)
- KILL as daily content: ch1 puzzle-trivia (factorial/fibonacci/palindrome/fizzbuzz),
  ch10–24 formula micro-implementations (a handful survive as theory items).
- NEW formats, in current schema first: messy-data pandas drills (CSV text in prelude →
  read_csv → clean → aggregate), spot-the-bug, predict-output, completion problems.
- SQL becomes tier-3–5: realistic e-commerce schema (adopt py-sql-dojo bank),
  window functions, CTEs, dedup, month-over-month, cohorts. 40+ target.
- Later (schema evolution, last slice): explain-this-output free text with keyword
  check, metric-judgment MCQs, weekly mini-project artifact.

## 6. Build plan (each slice ships through `npm test && npm run build`)
1. **Shell + skin**: new tokens/global.css, new App shell, 3-screen IA, Session mode,
   old engines untouched. Whole app looks/feels new on day one.
2. **Today/Session as default**: session pipeline over `buildDailySet` (3-act ordering).
3. **SQL upgrade**: e-commerce schema + harvested/extended exercises (validator-gated).
4. **Content philosophy pass**: new-format Python batch, then schema evolution.

## 7. Frozen invariants (architect's law)
- Question ids and `chNN-`/`sqlNN-`/`lesson-` prefixes: FROZEN (FSRS history keyed on them).
- localStorage keys `mlhub.progress.v1`, `mlhub.activity.v1`, `mlhub.currentChapter`: verbatim.
- Engines `src/lib/{srs,runner,sql,bank,lessons,stats,diff}`: untouched in slices 1–3.
- Validators stay wired into `npm test`; bank schema changes only in slice 4, atomically.
- Gardener routine stays paused until the new structure lands; then its prompt gets
  re-pointed (incl. replacing the cohere-design skill with the new system).
- PWA service worker: after each deploy the phone shows the old bundle once — reopen.

## Committee sign-off (2026-06-13)
Round 2 rebuttal verdicts: **Tanaka APPROVE** (escape-hatch + keyboard, both folded in
above), **Lindqvist APPROVE** (3-act session spec + cool-down→slice 2, folded in above).
O'Brien (SQL topics) and Adeyemi (slice-1+2 build risk) hit the shared session limit
before responding to round 2; their round-1 position papers are fully reflected in
sections 5 and 6/7. Direction is LOCKED. Outstanding for next session: re-ask O'Brien
for her 5 must-have SQL topics and Adeyemi for the slice-1+2 single-branch risk +
mitigation before/while building slice 3 and slices 1–2 respectively.
