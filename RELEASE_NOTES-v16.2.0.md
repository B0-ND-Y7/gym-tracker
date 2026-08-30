# Gym Tracker 16.2.0

This is a UI/flow patch over the working v16.1 release. It deliberately keeps the same v16 local-storage key and schema, so existing workouts, history, weight entries, notes and preferences are preserved.

## Fixed

- Restored the missing base button style. Front/Back, exercise-detail actions, Export/Import/Fresh Start, Start workout, Build workout, Change, Close and other `.button` controls now match the app.
- The rest bar no longer floats over Build or Progress. The mandatory countdown continues in the background and reappears only when the Workout tab is active.

## Builder flow

- Once the required exercises for a muscle are chosen, the page returns to **Choose a muscle** rather than leaving you down in the exercise list.
- The next unfinished muscle is visibly marked **Next**.
- Sessions with several muscle groups show a remaining-group count, a swipe cue, and automatically keep the relevant muscle chip horizontally visible.
- Tapping the anatomy map or a muscle chip still does not jump down to the exercise grid. You remain at the map and scroll down when ready.

## Exercise library

The v16.1 local library builder is retained. It targets up to 360 conventional movements while favouring machines, Smith, cable and straightforward dumbbell/barbell exercises. The release ZIP still intentionally excludes exercise media so updating the app shell cannot remove your existing library.
