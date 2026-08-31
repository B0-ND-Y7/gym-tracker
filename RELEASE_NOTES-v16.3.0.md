# Gym Tracker v16.3.0

Gym usability update built on v16.2.1. The v16 storage schema is unchanged.

## Added / improved

- Workout exercise **Swap** is prominent again.
- Swap sheet shows three recommended same-muscle replacements first, plus more alternatives.
- Swapping keeps the prescribed number of sets and uses the replacement exercise's rep range and previous-weight suggestion.
- Workout cards now show a compact **Last time** performance summary, e.g. `35 kg — 12 / 11 / 10` when the same working weight was used.
- Existing per-exercise notes are now clearly labelled **Setup notes** and remain saved against the exercise.
- Finish popup now includes the compact summary line: duration · completed sets · exercises.
- GIFs use lazy decoding/loading while the current and next unfinished workout GIF are explicitly preloaded.
- Haptic hooks fire for set completion, exercise completion, rest completion and workout completion on browsers that support the Web Vibration API.

## iPhone haptics

Safari/iOS PWAs do not currently expose the Web Vibration API, so genuine Taptic Engine feedback cannot be triggered by a normal web app. The feature is safely feature-detected and will work on supported browsers without affecting iPhone behaviour.
