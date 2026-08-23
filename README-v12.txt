Gym Tracker v12.1 — stable baseline

What is included
- Rolling split: Upper Push -> Upper Pull -> Legs A -> Lower Body B
- 106-exercise curated local GIF library
- Muscle-matched dynamic prep and post-workout stretches
- Fixed 2-minute rest timer after completed sets
- Automatic next-weight suggestions with manual edit
- Exercise favourites / avoid / unavailable preferences
- Workout history, PBs, progress and body-weight tracking
- JSON backup / restore
- iPhone/PWA safe-area layout

Important v12 fixes
- Only completed sets count toward PBs and progression.
- Partial workouts require confirmation before saving and advancing the split.
- Weight suggestions use the previous workout's actual prescribed sets/rep range.
- Saved workouts are read-only, preventing accidental duration/history overwrite.
- Exercise classification is stricter, especially biceps/triceps/lower-body roles.
- The media builder warns when a movement role has limited variety.
- HTML/JSON use network-first service-worker caching to prevent stale libraries.
- Clearing an unsaved workout also resets its workout timer.
- Changing the next split warns before clearing unsaved plans.
- Workout navigation automatically opens the appropriate current/next session.
- Body-weight date defaults use local time rather than UTC.

Existing generated exercise-library.json, prep-library.json, videos/ and images/ are intentionally not bundled in this ZIP.
For v12, run prepare-exercise-library.py once after extracting because its classifier has been improved.
