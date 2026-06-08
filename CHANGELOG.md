## Changelog

- 2026-06-08: gardener — PWA SW cache versioning: inject UTC build timestamp into dist/sw.js via scripts/patch-sw.js so each deploy gets a unique cache name, enabling correct stale-asset eviction on activate

- 2026-06-08: gardener added PWA web manifest — manifest.json, 192/512px icons, theme-color meta, Apple touch icon meta tags for installability on mobile home screens

- 2026-06-07: gardener added CodeMirror mobile scroll-into-view on focus — editor scrolls above virtual keyboard when tapped on iOS/Android

- 2026-06-07: gardener added 2 verified ch24 exercises (ch24-batch-predict-04, ch24-model-metadata-05) — batch prediction loop and model versioning metadata

- 2026-06-07: gardener guarded run() against concurrent Ctrl+Enter calls — keyboard shortcut now respects in-flight state

- 2026-06-07: gardener fixed CodeMirror font-size to 16px — prevents iOS Safari auto-zoom on mobile

- 2026-06-07: gardener added 2 verified exercises (ch13-kernel-rbf-04, ch15-gini-impurity-04)

- 2026-06-04: nightly gardener — add 3 verified exercises (ch06-rolling-mean-05, ch18-tfidf-score-04, ch21-average-linkage-04)
- 2026-06-05: nightly gardener — add 3 verified exercises (ch04-histogram-06, ch09-log-transform-05, ch19-scalar-projection-04)
- 2026-06-05: nightly gardener — add 3 verified exercises (ch02-linspace-07, ch08-adjusted-r2-06, ch22-border-point-04)
- 2026-06-05: gardener test run — add 2 verified exercises (ch06-lag-feature-06, ch16-gradient-step-04)
- 2026-06-06: nightly gardener — add 2 verified exercises (ch02-cumsum-08, ch17-mcc-05)

## 2026-06-06 — gardener — add 2 verified exercises (ch02-argsort-09, ch09-label-encoding-06)

## 2026-06-06 — Gardener run
- Added ch11-relu-05: relu activation (ch11, easy)
- Added ch02-outer-product-10: outer product (ch02, medium)
- 2026-06-06 gardener: added 2 verified exercises (ch11-tanh-06, ch02-percentile-11)
- 2026-06-06: gardener added 2 verified exercises (ch02-clip-12, ch10-bootstrap-04)
- 2026-06-06: gardener added 2 verified exercises (ch02-transpose-13, ch17-roc-auc-06)
- 2026-06-06: content gardener added 2 verified exercises (ch04-boxplot-07, ch12-knn-indices-05)
- 2026-06-07: gardener added mobile nav — header scrollable on ≤640px, 44px touch targets, version hidden
- Ctrl+Enter / Cmd+Enter keyboard shortcut triggers Run in Practice, Learn, and SQL tabs (CodeEditor Mod-Enter keymap)
- 2026-06-07: gardener — persist active tab to localStorage (mlhub.view.v1) so reload returns to last-visited tab
- 2026-06-08: gardener — PWA service worker (public/sw.js): stale-while-revalidate, pre-caches app shell, offline fallback
- 2026-06-08: gardener — added ch07-balanced-accuracy-05 (balanced accuracy) and ch10-l2-gradient-05 (L2 regularization gradient)
