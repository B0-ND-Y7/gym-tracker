# Gym Tracker 16.2.1

Small interaction and styling patch on top of v16.2.

## Changed

- Completing the required picks for a muscle now automatically selects the next unfinished muscle.
- The builder scrolls upward to **Choose a muscle** after that automatic advance.
- The anatomy map changes to the correct front/back view for the newly selected muscle.
- Rest only starts after a working set is explicitly marked complete and only while another working set remains.
- Completing the final working set clears the rest timer, so **Finish & save workout** is not blocked by a pointless final rest.
- The rest bar remains hidden on Build and Progress.
- Exercise `Choose` / `Use this` controls now use the same base button styling and teal accent as the rest of the app.
- Added a browser-button appearance reset and consistent keyboard focus styling.

## Data

No storage schema or key change. Existing v16.x data remains in place.
