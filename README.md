# Gym Tracker

A mobile-first workout builder and training tracker designed for a well-equipped commercial gym.

**Current release:** `16.3.0`

## Split

| Session | Main muscle groups |
| --- | --- |
| Push | Chest, shoulders, triceps |
| Legs 1 | Quads, hamstrings, glutes, hips, calves |
| Pull | Lats, upper back, rear delts, biceps |
| Legs 2 | Hamstrings, glutes, quads, hips, calves |

## v16.3.0 highlights

- Clear in-workout **Swap** flow with three recommended same-muscle alternatives first.
- Compact **Last time** performance shown beside weight guidance.
- Existing per-exercise notes are labelled **Setup notes** and stay with that exercise.
- End-of-workout popup now shows duration · sets · exercise count.
- Current/next workout GIF optimisation with lazy loading plus explicit preloading.
- Feature-detected haptic feedback hooks for supported browsers. iPhone Safari/PWAs currently do not expose the vibration API.

## Exercise media

The release ZIP intentionally does **not** contain `exercise-library.json`, `images/` or `videos/`. This prevents an app-shell update from deleting existing exercise media or breaking saved history.

To expand the curated exercise pool, run the included builder against the existing local dataset after extracting the release:

```bash
python3 prepare-exercise-library.py \
  --source ~/gym-exercise-lookup \
  --dest ~/gym-tracker
```

The builder targets up to 360 unique, conventional exercises. If strict filtering produces fewer suitable movements, it keeps the smaller high-quality set rather than padding the library with awkward variants. Existing media is retained; selected media is added/updated and `exercise-library.json` is regenerated.

## Updating an existing deployment

```bash
cd ~/Downloads
unzip -o gym-tracker-v16.3.0.zip -d ~/gym-tracker
cd ~/gym-tracker

python3 prepare-exercise-library.py \
  --source ~/gym-exercise-lookup \
  --dest ~/gym-tracker

git add -A
git commit -m "Gym tracker v16.3 - gym usability polish"
git pull --rebase origin main
git push
```

## Tests

```bash
node --check app.js
node --check core.mjs
node --check sw.js
node --test tests/core.test.mjs
python3 -m py_compile prepare-exercise-library.py
```

The tests cover exercise classification, cable/setup filtering, candidate deduplication, preferences, progression, v12/v13 backup migration, state validation and anatomy-map grouping.

## Design palette

- Concrete grey `#8C8B85`
- Blue-grey `#5B6673`
- Charcoal `#2B2B2B`
- Muted amber `#B87333`
- Muted teal `#4C8C8F`

## Third-party software

The interactive anatomy map uses [Body Muscles](https://github.com/vulovix/body-muscles), licensed under Apache 2.0. See `THIRD_PARTY_NOTICES.md` and `licenses/`.
