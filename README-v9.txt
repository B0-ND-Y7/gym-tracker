Gym Tracker v9.3
==============

Changes from v8.5:
- 106 main exercise GIFs selected from your local 1,324-file library.
- Separate prep/stretch GIF selection from the same local library.
- Tailored warm-up cardio, dynamic prep, ramp-up sets, post-lift cardio and static stretches for each split.
- Exercise and prep GIFs are tappable for a larger view.
- Full exercise view prominently shows equipment/machine, target muscle, secondary muscles and technique.
- More iPhone/PWA-friendly safe-area handling; the app no longer uses the translucent iOS status bar mode.
- Rolling split remains Upper Push -> Upper Pull -> Legs A -> Lower Body B. It advances only when Finish and save is pressed.

Prepare the local media:

  python3 prepare-exercise-library.py \
    --source ~/gym-exercise-lookup \
    --dest ~/gym-tracker

Review selections:

  cat exercise-library-selection.txt
  cat prep-library-selection.txt

The 106 main exercises and prep/stretch movements are copied locally from your own media collection.

Prep matcher tightened in v9.3 to reject jump/roller/band/ball/machine false positives.


v9.3 matcher cleanup:
- Rejects squat-row combinations for bodyweight squat prep.
- Rejects walking-lunge and wall variations for high-knee prep.
- A missing prep GIF is intentionally preferred over an incorrect movement.
