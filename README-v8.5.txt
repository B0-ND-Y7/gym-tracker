Gym Tracker v8.5
================

This version uses your local ~/gym-exercise-lookup media library.
It does NOT contain any exercise GIFs or thumbnails itself.

The helper selects about 100 ordinary commercial-gym exercises from your 1,324-entry lookup, copies only those selected GIFs/thumbnails into this project, and writes exercise-library.json.

Workout rotation:
  Upper Push -> Upper Pull -> Legs A -> Lower Body B -> repeat

The sequence advances only when Finish and save is pressed.
The Weekend/+1 session is optional. If skipped, Monday continues with the next split.

Variation:
  - Main anchor movement: held for roughly two weeks.
  - Supporting movements: rotate weekly.
  - Recent variants are avoided where possible.
  - Each session stays at six exercises maximum.

Prepare the media:

  python3 prepare-exercise-library.py \
    --source ~/gym-exercise-lookup \
    --dest ~/gym-tracker

Review what it selected:

  cat exercise-library-selection.txt

Then commit and push normally.

The app uses relative asset paths, so it works both at a GitHub Pages /repo-name/ URL and behind a custom domain.
