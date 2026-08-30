Gym Tracker v14

New workout selection model:
- Four splits: Push, Legs 1, Pull, Legs 2.
- Each split is separated by muscle group.
- Interactive body map highlights only muscles used by the current split.
- Tap a muscle to see a 3-column grid of suitable exercises.
- Pick an exercise and it is saved to that muscle for the current workout.
- Change opens the same muscle's exercise grid again.
- Refresh swaps to another exercise from the same muscle pool.
- Common exercises are prioritised, including curls, presses, rows, pulldowns, leg press, hack squat and machine work.
- Avoided/unavailable exercises are excluded and favourites are prioritised.
- Existing history, weight log, preferences and notes remain in the existing localStorage keys.
- v12/v13 backups can still be imported.
- Rest timer remains available after completing a set.

Prep/stretch functionality has been removed from the v14 app for now.

The app expects exercise-library.json in the same directory. The GIF/image paths inside that JSON should be relative to the deployed site, such as videos/... and images/....
