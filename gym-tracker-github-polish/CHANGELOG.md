# Changelog

## v12.1

### Fixed

- Preserve previously generated exercise GIFs and images during library rebuilds.
- Validate that generated library entries point to media that actually exists.
- Repair older unsaved workout plans when they reference exercises no longer present in the current library.
- Gracefully handle unavailable demonstration media instead of showing a broken image.
- Refresh PWA caching so updated application/library files are fetched correctly.

## v12.0

### Stable baseline

- Completed sets only count toward PBs and progression.
- Added confirmation before saving incomplete workouts.
- Corrected automatic next-weight progression logic.
- Protected saved workout duration/history from accidental overwrite.
- Tightened exercise role classification in the media builder.
- Added role-variety validation warnings.
- Changed HTML/JSON service-worker handling to network-first.
- Improved unsaved workout reset and rotation handling.
- Improved workout navigation and local-date handling.
- Added basic backup validation.

## v11.x

- Introduced the streamlined Home / Workout / Progress / More interface.
- Added automatic weight suggestions.
- Added favourite / avoid / unavailable exercise preferences.
- Added workout completion summaries.
- Added dynamic prep selection and randomisation.
- Added full current-workout regeneration.
