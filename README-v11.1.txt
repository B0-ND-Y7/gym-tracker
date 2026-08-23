Gym Tracker v11.1

Changes:
- Dynamic prep now rotates week to week from a larger GIF pool.
- Prep selection is exercise-aware: only movements tagged for the muscles in the current workout are eligible.
- Post-workout static stretches use the same muscle-aware selection.
- Three dynamic movements before lifting and three static stretches after lifting keep the routine short.
- Existing text fallbacks remain when no suitable GIF is found. No broken image placeholders.
- Main 106-exercise rotation, 2-minute rest timer, weight recommendations, preferences, progress, history and body-weight tracking are unchanged.

IMPORTANT: run prepare-exercise-library.py once after installing v11.1 so prep-library.json is rebuilt with the expanded pool and the additional GIFs are copied into videos/ and images/.
