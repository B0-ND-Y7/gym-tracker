# Gym Tracker

> A simple, offline-first workout tracker built for actual use in the gym.

[![Version](https://img.shields.io/badge/version-12.1-30d158?style=flat-square)](./VERSION)
[![PWA](https://img.shields.io/badge/PWA-installable-30d158?style=flat-square)](./manifest.webmanifest)
[![GitHub Pages](https://img.shields.io/badge/hosted-GitHub%20Pages-222?style=flat-square&logo=github)](https://gym.nmod.uk)
[![No backend](https://img.shields.io/badge/backend-none-30d158?style=flat-square)](#privacy--data)

**Live app:** https://gym.nmod.uk

Gym Tracker is a mobile-first Progressive Web App for logging workouts without accounts, subscriptions or a backend. It generates a rolling gym programme, tracks weights and reps, remembers exercise preferences, suggests the next working weight, and keeps progress stored locally on the device.

## Features

- **Rolling four-workout split** — Upper Push → Upper Pull → Legs A → Lower Body B
- **106-exercise curated pool** with GIF demonstrations
- **Machine-friendly exercise selection** with equipment shown clearly
- **Dynamic warm-up preparation** matched to the muscles trained that day
- **Relevant post-workout stretches** rather than generic stretching
- **Randomise dynamic prep** without changing to unrelated body parts
- **Automatic next-weight suggestions** based on completed sets and rep targets
- **Editable suggested weights** for machines with different plate/stack increments
- **Exercise preferences** — favourite, avoid, or mark equipment as unavailable
- **Exercise swapping** within the current workout
- **Fixed 2-minute rest timer** after completed sets
- **Workout summaries** with duration, completed sets, PBs and improvements
- **Workout history and strength progress**
- **Body-weight tracking and trend chart**
- **JSON backup and restore**
- **Installable iPhone / PWA interface** with safe-area support
- **Offline-friendly caching** while keeping workout libraries fresh

## How the workout rotation works

The programme does **not** reset every Monday.

```text
Upper Push
    ↓
Upper Pull
    ↓
Legs A
    ↓
Lower Body B
    ↓
repeat
```

The sequence advances only when a workout is finished and saved. The optional weekend session behaves like a normal workout if it is completed; skipping it does not skip anything in the rotation.

## Progression

The app uses simple double progression.

When all prescribed working sets are completed at the top of the rep range, Gym Tracker automatically suggests a small weight increase the next time that exact exercise appears. Otherwise it carries the previous working weight forward.

Suggested weights are filled in automatically but can be unlocked and edited at any time.

Only sets explicitly marked as completed are used for PBs and progression decisions.

## Dynamic prep and stretching

Warm-up movements are chosen according to the exercises in the generated session.

For example, an Upper Push session prioritises chest and shoulder preparation, while a Lower Body session prioritises hips, quads, hamstrings, glutes, calves and ankle mobility as appropriate.

The Dynamic Prep section can be randomised to get another suitable combination without introducing unrelated stretches.

A typical session flow is:

```text
5–6 min easy treadmill / bike
        ↓
3 dynamic preparation movements
        ↓
1–2 light ramp-up sets
        ↓
Working sets
        ↓
Optional cardio finish
        ↓
3 relevant static stretches
```

## Privacy & data

Gym Tracker has no user accounts and no application backend.

Workout history, body weight, exercise preferences, rotation state and current-session data are stored locally in the browser on the device using Web Storage.

The app includes JSON export/import so important training history can be backed up manually.

Clearing browser/site data for the app domain will remove locally stored workout data unless it has been exported first.

## Project structure

```text
gym-tracker/
├── index.html                    # Application UI and workout logic
├── manifest.webmanifest          # PWA manifest
├── sw.js                         # Offline/service-worker behaviour
├── VERSION                       # Current release version
├── prepare-exercise-library.py   # Builds the curated exercise/prep libraries
├── exercise-library.json         # Generated main exercise library
├── prep-library.json             # Generated prep/stretch library
├── images/                       # Generated exercise thumbnails
├── videos/                       # Generated exercise GIFs
├── CNAME                         # GitHub Pages custom domain
└── LICENSES.md                   # Third-party media/licensing notes
```

## Rebuilding the exercise library

The application uses a locally available exercise dataset to generate its curated libraries.

```bash
python3 prepare-exercise-library.py \
  --source ~/gym-exercise-lookup \
  --dest ~/gym-tracker
```

The builder validates generated media references and deliberately keeps previously copied media files so an older workout stored on a device does not suddenly lose its demonstration GIF after a library rebuild.

## Deployment

The project is a static site and is currently deployed with GitHub Pages.

After making changes:

```bash
git add .
git commit -m "Update Gym Tracker"
git pull --rebase origin main
git push
```

GitHub Pages then publishes the updated site at **gym.nmod.uk**.

## Technology

- HTML5
- CSS
- Vanilla JavaScript
- Progressive Web App / Service Worker
- Python library preparation utility
- GitHub Pages
- Browser local storage

There is no framework, package manager, database or server-side runtime required for the application itself.

## Exercise media

Exercise demonstration media is handled separately from the application source and may be subject to third-party rights or licensing terms. See [`LICENSES.md`](./LICENSES.md) for media/licensing notes before redistributing those assets.

## Status

**v12.1** is the current stable baseline intended for real workout use.

The focus of future changes is reliability and improvements discovered through actual gym sessions rather than adding unnecessary features.
