# Changelog

## 16.2.0 — builder navigation and UI polish

- Restored the missing base `.button` styling so all app actions use the same visual system.
- Completing a muscle now returns to the Choose a muscle section instead of leaving the user down in the exercise grid.
- Added a visible Next marker, remaining-muscle count and horizontal swipe cue for sessions with several muscle groups.
- Keeps the relevant muscle chip horizontally visible without vertically jumping when a muscle is tapped.
- Rest bar is now hidden outside the active Workout screen while its countdown continues normally.
- Kept the v16 storage/schema unchanged so existing v16.1 data remains in place.

## 16.1.0 — picker, backup and exercise-library refinement

- Changed chooser previews to animated GIFs and moved exercise preferences into a large tap-to-open detail sheet.
- Removed Favourite / Avoid / Not at my gym controls from the compact chooser cards.
- Added large exercise demos and optional instructions in the detail sheet.
- Added native v13 backup migration for history, body weight, rotation, notes and filename-keyed preferences.
- Removed the early-end rest control and locked the next incomplete set until the fixed 2:00 rest reaches zero.
- Prevented workout completion while a mandatory rest period is active.
- Removed automatic page scrolling and automatic muscle advancement from the workout builder.
- Increased the immediate top-pick grid from 9 to 12 exercises and retained Browse all for the complete muscle list.
- Added a v16.1 local media builder targeting up to 360 conventional exercises from the full source dataset.
- Added decline pressing as a first-class chest role and broadened straightforward machine, Smith, cable and free-weight staples.
- Preserved the v16 palette while making chooser media, modal detail and rest states clearer on mobile.

## 16.0.0 — audited rebuild

- Split the app into `index.html`, `styles.css`, `app.js` and testable `core.mjs` modules.
- Rebuilt the workout builder around explicit muscle groups and exact exercise selection.
- Added strict role-based muscle classification to prevent exercises leaking into the wrong muscle group.
- Deduplicated near-identical exercise variants and prioritised straightforward machine, Smith, cable and free-weight staples.
- Removed awkward lying/supine/floor cable choices from the normal pool while retaining useful standing and seated cable work.
- Added hips/adductor/abductor slots to both lower-body sessions.
- Added per-set weight/reps/completion logging and a fixed automatic two-minute rest timer.
- Added automatic next-weight suggestions that only increase after every prescribed completed set reaches the top of the rep range at the same working weight.
- Added exercise-specific notes and mutually exclusive Favourite / Avoid / Not at my gym preferences.
- Added safer partial-workout handling and rotation advancement only after saving a session.
- Added backup migration for older Gym Tracker history formats.
- Added stronger state validation, draft sanitisation and UI error handling.
- Improved PWA caching so HTML/code/JSON update network-first while exercise media remains cache-first.
- Added dedicated PWA icons and iPhone safe-area handling.
- Removed all stretch/prep code from the application for this release.
