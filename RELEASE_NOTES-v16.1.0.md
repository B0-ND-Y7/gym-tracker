# Gym Tracker 16.1.0

This release focuses on the real-world exercise-picking and workout flow.

## Changed

- Exercise selection cards now play the local GIF and open a large, cleaner exercise detail sheet when tapped.
- Favourite, Not at my gym and Avoid controls live in that detail sheet instead of crowding the exercise grid.
- The anatomy map now only changes the selected muscle; it never jumps the page or automatically moves on after a choice.
- Rest is a fixed two-minute period with no early-end button. Incomplete set-completion controls remain locked until the timer reaches 0:00.
- v13 JSON backups are migrated into the v16 state model.
- The included `prepare-exercise-library.py` can rebuild a substantially larger conventional exercise pool from the existing local source dataset.

## Data preserved from v13 imports

Completed workout history, recorded set data, body-weight entries, rotation position, exercise notes and Favourite/Avoid/Not at my gym preferences are migrated. Old in-progress v13 plans are intentionally not restored because the v16 workout structure is different.
