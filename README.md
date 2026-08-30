# Gym Tracker

A mobile-first workout builder and training tracker designed for a well-equipped commercial gym.

**Current release:** `16.0.0`

## What it does

Gym Tracker uses a four-session rolling split:

| Session | Main muscle groups |
| --- | --- |
| Push | Chest, shoulders, triceps |
| Legs 1 | Quads, hamstrings, glutes, hips, calves |
| Pull | Lats, upper back, rear delts, biceps |
| Legs 2 | Hamstrings, glutes, quads, hips, calves |

The workout builder lets you choose the exact exercises for each muscle group instead of forcing a random workout. The interactive anatomy map and muscle buttons both open the same filtered exercise choices.

## Features

- Muscle-first workout builder with selectable Push / Legs 1 / Pull / Legs 2 days
- Interactive front/back anatomical muscle map
- Exercise GIF/image demonstrations from the local exercise library
- Machine and Smith-machine biased exercise ranking, while retaining useful cable and free-weight options
- Awkward lying/supine/floor cable variations filtered out
- Favourite, Avoid and Not at my gym preferences
- Per-exercise setup notes such as seat/pad/pin positions
- Per-set weight, reps and completion tracking
- Automatic next-weight suggestions using double progression
- Fixed two-minute automatic rest timer after a completed set
- Workout history, body-weight log and JSON backup/restore
- Offline-capable PWA shell and iPhone safe-area support
- Local-only workout data; no backend account required

## Exercise media

The release package intentionally does **not** contain:

- `exercise-library.json`
- `images/`
- `videos/`

Those are generated/maintained separately in the deployed repository so an app-shell update cannot delete or overwrite existing exercise media.

## Updating an existing deployment

Copy the release ZIP into the root of the existing repository:

```bash
cd ~/Downloads
unzip -o gym-tracker-v16.0.0.zip -d ~/gym-tracker
cd ~/gym-tracker

git add -A
git commit -m "Gym tracker v16 - audited rebuild"
git pull --rebase origin main
git push
```

No exercise-library rebuild is required for the v16 app-shell update.

## Tests

Core tests can be run with Node.js:

```bash
node --check app.js
node --check core.mjs
node --check sw.js
node tests/core.test.mjs
```

The tests cover exercise classification, awkward-exercise filtering, candidate deduplication, preferences, weight progression, backup migration, state validation and anatomy-map grouping.

## Design palette

- Concrete grey `#8C8B85`
- Blue-grey `#5B6673`
- Charcoal `#2B2B2B`
- Muted amber `#B87333`
- Muted teal `#4C8C8F`

## Third-party software

The interactive anatomy map uses [Body Muscles](https://github.com/vulovix/body-muscles), licensed under Apache 2.0. See `THIRD_PARTY_NOTICES.md` and `licenses/`.
