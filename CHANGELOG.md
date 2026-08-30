# Changelog

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
