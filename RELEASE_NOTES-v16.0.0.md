# Gym Tracker v16.0.0

This is the audited rebuild of Gym Tracker.

## Install

```bash
cd ~/Downloads
unzip -o gym-tracker-v16.0.0.zip -d ~/gym-tracker
cd ~/gym-tracker

cat VERSION

git add -A
git commit -m "Gym tracker v16 - audited rebuild"
git pull --rebase origin main
git push
```

`cat VERSION` should return:

```text
16.0.0
```

Do **not** run the exercise-library builder for this update. The release deliberately omits the generated exercise library and media directories.

## Verification

```bash
node --check app.js
node --check core.mjs
node --check sw.js
node tests/core.test.mjs

git status
git log -1 --oneline
```
