import {
  APP_VERSION, SCHEMA_VERSION, STORAGE_KEY, LEGACY_KEYS, MUSCLES, DAYS,
  defaultState, escapeHtml as esc, lower, normalizeLibrary, candidatesForMuscle,
  repRangeFor, suggestWeight, workoutTotals, validateState, parseBackupPayload,
  mapLabelToMuscle, findPreviousExercise, historyWorkoutSetCounts, historyWorkoutDate,
  sanitizeDrafts, setPreference, preferenceState, validSetInput
} from './core.mjs';

const BODY_MUSCLES_SOURCES = [
  'https://unpkg.com/body-muscles@1.0.0/dist/umd/body-muscles.umd.min.js',
  'https://cdn.jsdelivr.net/npm/body-muscles@1.0.0/dist/umd/body-muscles.umd.min.js'
];

let state = loadState();
let library = [];
let libraryById = new Map();
let libraryStatus = 'loading';
let libraryError = '';
let activeTab = state.workout ? 'workout' : 'build';
let currentMuscle = firstMuscle(state.builderDay);
let mapView = MUSCLES[currentMuscle].view;
let mapChart = null;
let bodyMusclesPromise = null;
let mapLoadFailedAt = 0;
let searchTerm = '';
let showAllForMuscle = false;
let restInterval = null;
let modalReturnFocus = null;

const app = document.getElementById('app');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const importFile = document.getElementById('importFile');
const toastEl = document.getElementById('toast');
const restBar = document.getElementById('restBar');
const restText = document.getElementById('restText');

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return validateState(JSON.parse(raw));
  } catch (error) {
    console.warn('Could not load v16 state', error);
  }

  // Non-destructive migration path for anyone who opens v16 before doing a fresh start.
  for (const key of LEGACY_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const legacy = JSON.parse(raw);
      const migrated = validateState(legacy);
      migrated.workout = null; // old active workout shape is not compatible with per-set v16 tracking
      return migrated;
    } catch (error) {
      console.warn(`Could not read legacy state ${key}`, error);
    }
  }
  return defaultState();
}

function persist() {
  try {
    state.schemaVersion = SCHEMA_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Could not save Gym Tracker state', error);
    toast('Could not save locally. Export a backup before closing the app.');
    return false;
  }
}

function firstMuscle(dayIndex = state.builderDay) {
  return DAYS[clampDay(dayIndex)].plan[0].muscle;
}

function clampDay(value) {
  const number = Number(value) || 0;
  return Math.max(0, Math.min(DAYS.length - 1, number));
}

function currentDay() {
  return DAYS[clampDay(state.builderDay)];
}

function planEntry(muscle, dayIndex = state.builderDay) {
  return DAYS[clampDay(dayIndex)].plan.find(entry => entry.muscle === muscle);
}

function draft(dayIndex = state.builderDay) {
  const key = String(clampDay(dayIndex));
  if (!state.drafts[key] || typeof state.drafts[key] !== 'object') state.drafts[key] = {};
  return state.drafts[key];
}

function selection(muscle, dayIndex = state.builderDay) {
  const value = draft(dayIndex)[muscle];
  return Array.isArray(value) ? value.map(String) : [];
}

function exById(id) {
  return libraryById.get(String(id));
}

function dayComplete(dayIndex = state.builderDay) {
  return DAYS[clampDay(dayIndex)].plan.every(entry => selection(entry.muscle, dayIndex).length >= entry.slotSets.length);
}

function selectedCount(dayIndex = state.builderDay) {
  return DAYS[clampDay(dayIndex)].plan.reduce((total, entry) => total + selection(entry.muscle, dayIndex).length, 0);
}

function nextIncompleteMuscle(after = currentMuscle) {
  const plan = currentDay().plan;
  let index = plan.findIndex(entry => entry.muscle === after);
  if (index < 0) index = 0;
  for (let offset = 1; offset <= plan.length; offset++) {
    const entry = plan[(index + offset) % plan.length];
    if (selection(entry.muscle).length < entry.slotSets.length) return entry.muscle;
  }
  return null;
}

async function loadLibrary() {
  libraryStatus = 'loading';
  libraryError = '';
  try {
    const response = await fetch('./exercise-library.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    library = normalizeLibrary(await response.json());
    if (!library.length) throw new Error('exercise-library.json contained no usable exercises');
    libraryById = new Map(library.map(exercise => [exercise.id, exercise]));
    state.drafts = sanitizeDrafts(state.drafts, library, state.prefs);
    libraryStatus = 'ready';
    persist();
  } catch (error) {
    console.error('Exercise library failed to load', error);
    library = [];
    libraryById = new Map();
    libraryStatus = 'error';
    libraryError = error?.message || String(error);
  }
  render();
}

function candidateList(muscle) {
  return candidatesForMuscle(library, muscle, state.prefs);
}

function selectDay(dayIndex) {
  state.builderDay = clampDay(dayIndex);
  currentMuscle = firstMuscle(state.builderDay);
  mapView = MUSCLES[currentMuscle].view || currentDay().defaultView;
  searchTerm = '';
  showAllForMuscle = false;
  activeTab = 'build';
  persist();
  render();
}

function chooseMuscle(muscle, scroll = false) {
  if (!currentDay().plan.some(entry => entry.muscle === muscle)) {
    toast(`That muscle is not part of ${currentDay().name}.`);
    return;
  }
  currentMuscle = muscle;
  mapView = MUSCLES[muscle].view || currentDay().defaultView;
  searchTerm = '';
  showAllForMuscle = false;
  render();
  if (scroll) requestAnimationFrame(() => document.getElementById('exercisePicker')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function addSelection(muscle, exerciseId) {
  const entry = planEntry(muscle);
  if (!entry) return;
  const exercise = exById(exerciseId);
  if (!exercise || !candidateList(muscle).some(candidate => candidate.id === String(exerciseId))) {
    toast('That exercise is not available for this muscle.');
    return;
  }
  const dayDraft = draft();
  const selected = selection(muscle);
  if (selected.includes(String(exerciseId))) return;
  if (selected.length >= entry.slotSets.length) {
    toast(`${MUSCLES[muscle].label} already has the required exercises.`);
    return;
  }
  dayDraft[muscle] = [...selected, String(exerciseId)];
  persist();

  const completedMuscle = dayDraft[muscle].length >= entry.slotSets.length;
  const next = completedMuscle ? nextIncompleteMuscle(muscle) : null;
  if (next) {
    currentMuscle = next;
    mapView = MUSCLES[next].view;
    searchTerm = '';
    showAllForMuscle = false;
    toast(`${MUSCLES[muscle].label} done · next ${MUSCLES[next].label}`);
  }
  render();
}

function removeSelection(muscle, exerciseId) {
  const dayDraft = draft();
  dayDraft[muscle] = selection(muscle).filter(id => id !== String(exerciseId));
  persist();
  render();
}

function cleanExerciseFromDrafts(exerciseId) {
  const id = String(exerciseId);
  for (const dayDraft of Object.values(state.drafts)) {
    if (!dayDraft || typeof dayDraft !== 'object') continue;
    for (const muscle of Object.keys(dayDraft)) {
      dayDraft[muscle] = (dayDraft[muscle] || []).filter(value => String(value) !== id);
    }
  }
}

function toggleFavourite(exerciseId) {
  const id = String(exerciseId);
  const current = preferenceState(state.prefs, id);
  state.prefs = setPreference(state.prefs, id, current === 'fav' ? 'normal' : 'fav');
  persist();
  toast(current === 'fav' ? 'Favourite removed.' : 'Added to favourites.');
  render();
}

function avoidExercise(exerciseId) {
  const id = String(exerciseId);
  state.prefs = setPreference(state.prefs, id, 'avoid');
  cleanExerciseFromDrafts(id);
  persist();
  toast('Exercise hidden from future choices.');
  render();
}

function markUnavailable(exerciseId) {
  const id = String(exerciseId);
  state.prefs = setPreference(state.prefs, id, 'unavailable');
  cleanExerciseFromDrafts(id);
  persist();
  toast('Marked unavailable at your gym.');
  render();
}

function restoreExercisePreference(exerciseId) {
  state.prefs = setPreference(state.prefs, String(exerciseId), 'normal');
  persist();
  toast('Exercise restored.');
  render();
}

function startWorkout() {
  if (libraryStatus !== 'ready') { toast('Exercise library is not ready yet.'); return; }
  if (state.workout && !confirm('Replace the active workout? Any unsaved set entries in it will be lost.')) return;
  if (!dayComplete()) {
    const missing = currentDay().plan.find(entry => selection(entry.muscle).length < entry.slotSets.length);
    if (missing) chooseMuscle(missing.muscle, true);
    toast('Choose the remaining exercises first.');
    return;
  }

  const items = [];
  for (const entry of currentDay().plan) {
    selection(entry.muscle).forEach((exerciseId, slotIndex) => {
      const exercise = exById(exerciseId);
      if (!exercise) return;
      const targetSets = entry.slotSets[slotIndex];
      const repRange = repRangeFor(exercise, entry.muscle);
      const suggestion = suggestWeight(state.history, exercise, entry.muscle, repRange, targetSets);
      items.push({
        uid: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        muscle: entry.muscle,
        exerciseId,
        targetSets,
        repRange,
        suggestionReason: suggestion.reason,
        sets: Array.from({ length: targetSets }, () => ({ weight: suggestion.weight, reps: '', done: false })),
        note: state.notes[exerciseId] || ''
      });
    });
  }

  state.workout = {
    schemaVersion: SCHEMA_VERSION,
    version: APP_VERSION,
    day: state.builderDay,
    startedAt: Date.now(),
    items
  };
  state.restUntil = 0;
  persist();
  activeTab = 'workout';
  toast('Workout ready.');
  render();
}

function updateSet(itemIndex, setIndex, field, value) {
  const set = state.workout?.items?.[itemIndex]?.sets?.[setIndex];
  if (!set || !['weight','reps'].includes(field)) return;
  const cleaned = String(value ?? '').replace(',', '.');
  if (!validSetInput(field, cleaned)) return;
  set[field] = cleaned;
  persist();
}

function toggleSet(itemIndex, setIndex) {
  const set = state.workout?.items?.[itemIndex]?.sets?.[setIndex];
  if (!set) return;
  if (!set.done) {
    if (!validSetInput('reps', set.reps) || String(set.reps).trim() === '') {
      toast('Enter valid reps before completing the set.');
      return;
    }
    if (!validSetInput('weight', set.weight)) {
      toast('Enter a valid weight, or leave weight blank.');
      return;
    }
  }
  set.done = !set.done;
  set.completedAt = set.done ? Date.now() : null;
  if (set.done) startRest();
  persist();
  renderWorkout(app);
}

function updateNote(itemIndex, note) {
  const item = state.workout?.items?.[itemIndex];
  if (!item) return;
  item.note = String(note ?? '');
  state.notes[item.exerciseId] = item.note;
  persist();
}

function replaceWorkoutExercise(itemIndex, exerciseId) {
  const item = state.workout?.items?.[itemIndex];
  const exercise = exById(exerciseId);
  if (!item || !exercise) return;
  // Suggested weights are pre-filled, so they do not count as logged progress.
  // Only warn if the user has actually entered reps or completed a set.
  const hasProgress = (item.sets || []).some(set => set.done || String(set.reps || '').trim() !== '');
  if (hasProgress && !confirm('Change this exercise? The set entries for this exercise will be cleared.')) return;
  item.exerciseId = exercise.id;
  item.note = state.notes[exercise.id] || '';
  item.repRange = repRangeFor(exercise, item.muscle);
  const suggestion = suggestWeight(state.history, exercise, item.muscle, item.repRange, item.targetSets);
  item.suggestionReason = suggestion.reason;
  item.sets = Array.from({ length: item.targetSets }, () => ({ weight: suggestion.weight, reps: '', done: false }));
  persist();
  closeModal();
  render();
}

function discardWorkout() {
  if (!state.workout) return;
  const counts = workoutSetCounts();
  const message = counts.done
    ? `Discard this workout and its ${counts.done} completed set${counts.done === 1 ? '' : 's'}? Your chosen exercises stay in the builder.`
    : 'Discard this workout? Your chosen exercises stay in the builder.';
  if (!confirm(message)) return;
  state.workout = null;
  state.restUntil = 0;
  persist();
  activeTab = 'build';
  toast('Workout discarded.');
  render();
}

function workoutSetCounts(workout = state.workout) {
  if (!workout) return { done: 0, total: 0 };
  if (workout !== state.workout || !(workout.items || []).every(item => Array.isArray(item.sets))) {
    return historyWorkoutSetCounts(workout);
  }
  let done = 0;
  let total = 0;
  for (const item of workout.items || []) {
    for (const set of item.sets || []) {
      total++;
      if (set.done) done++;
    }
  }
  return { done, total };
}

function finishWorkout() {
  if (!state.workout) return;
  const counts = workoutSetCounts();
  const incomplete = counts.total - counts.done;
  if (counts.done === 0) { toast('Complete at least one working set before saving.'); return; }
  if (incomplete && !confirm(`${incomplete} working set${incomplete === 1 ? '' : 's'} not marked complete. Save this as a partial workout?`)) return;

  const completedWorkout = typeof structuredClone === 'function' ? structuredClone(state.workout) : JSON.parse(JSON.stringify(state.workout));
  completedWorkout.finishedAt = Date.now();
  completedWorkout.durationSeconds = Math.max(0, Math.round((completedWorkout.finishedAt - completedWorkout.startedAt) / 1000));
  completedWorkout.partial = incomplete > 0;
  completedWorkout.completedSets = counts.done;
  completedWorkout.totalSets = counts.total;
  completedWorkout.pbs = calculatePBs(completedWorkout);
  state.history.push(completedWorkout);

  const completedDay = completedWorkout.day;
  state.rotationDay = (completedDay + 1) % DAYS.length;
  state.builderDay = state.rotationDay;
  delete state.drafts[String(completedDay)];
  state.workout = null;
  state.restUntil = 0;
  currentMuscle = firstMuscle(state.builderDay);
  mapView = MUSCLES[currentMuscle].view;
  persist();
  showFinishSummary(completedWorkout);
}

function calculatePBs(workout) {
  const pbs = [];
  for (const item of workout.items || []) {
    const completed = (item.sets || []).filter(set => set.done && Number(set.weight) >= 0 && Number(set.reps) > 0);
    if (!completed.length) continue;
    const bestNow = Math.max(...completed.map(set => Number(set.weight) || 0));
    const previous = findPreviousExercise(state.history, item.exerciseId);
    const previousBest = previous ? Math.max(...previous.sets.map(set => Number(set.weight) || 0)) : null;
    if (previousBest == null || bestNow > previousBest) {
      pbs.push({ exerciseId: item.exerciseId, weight: bestNow, first: previousBest == null });
    }
  }
  return pbs;
}

function showFinishSummary(workout) {
  const day = DAYS[workout.day];
  const pbs = workout.pbs || [];
  const duration = formatDuration(workout.durationSeconds);
  modalReturnFocus = document.activeElement;
  modalBody.innerHTML = `
    <div class="modal-header">
      <div><div class="eyebrow">Workout saved</div><h2 id="modalTitle">${esc(day.name)} complete</h2></div>
      <button class="button compact" type="button" data-action="close-modal">Close</button>
    </div>
    <div class="stats-grid">
      <div class="stat"><strong>${esc(duration)}</strong><span>duration</span></div>
      <div class="stat"><strong>${workout.completedSets}/${workout.totalSets}</strong><span>sets completed</span></div>
      <div class="stat"><strong>${pbs.length}</strong><span>new bests</span></div>
    </div>
    <div class="panel" style="padding:12px">
      <div class="small">Next workout</div>
      <strong>${esc(DAYS[state.rotationDay].name)}</strong>
      ${pbs.length ? `<div class="small" style="margin-top:8px">${pbs.map(pb => `${esc(exById(pb.exerciseId)?.name || 'Exercise')}: ${pb.first ? 'first recorded result' : `${pb.weight} kg best`}`).join('<br>')}</div>` : ''}
    </div>`;
  openModal();
  activeTab = 'build';
  render(false);
}

function startRest() {
  state.restUntil = Date.now() + 120000;
  persist();
  updateRestBar();
  if (!restInterval) restInterval = window.setInterval(updateRestBar, 500);
}

function endRest() {
  state.restUntil = 0;
  persist();
  updateRestBar();
}

function updateRestBar() {
  const remainingMs = Math.max(0, Number(state.restUntil || 0) - Date.now());
  const seconds = Math.ceil(remainingMs / 1000);
  if (seconds <= 0) {
    if (state.restUntil) {
      state.restUntil = 0;
      persist();
      navigator.vibrate?.([100,60,100]);
      toast('Rest complete.');
    }
    restBar.hidden = true;
    if (restInterval) {
      clearInterval(restInterval);
      restInterval = null;
    }
    return;
  }
  restBar.hidden = false;
  restText.textContent = formatClock(seconds);
}

function formatClock(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes} min`;
}

function setTab(tab) {
  if (!['build','workout','progress'].includes(tab)) return;
  activeTab = tab;
  render();
}

function topbar(title, subtitle) {
  return `
    <header class="topbar">
      <div><div class="brand">${esc(title)}</div><div class="subtitle">${esc(subtitle)}</div></div>
      <span class="version">v${APP_VERSION} · ${libraryStatus === 'loading' ? 'loading…' : libraryStatus === 'error' ? 'library error' : `${library.length} exercises`}</span>
    </header>`;
}

function render(allowMap = true) {
  try {
    document.querySelectorAll('.nav-button').forEach(button => button.classList.toggle('active', button.dataset.tab === activeTab));
    if (activeTab === 'build') renderBuild(app, allowMap);
    else if (activeTab === 'workout') renderWorkout(app);
    else renderProgress(app);
    updateRestBar();
  } catch (error) {
    console.error('Gym Tracker render failed', error);
    app.innerHTML = `${topbar('Gym Tracker', 'A screen could not be rendered')}<div class="error"><strong>Something went wrong.</strong><br>${esc(error?.message || String(error))}<br><br>Reloading is safe; your saved data is kept locally.</div>`;
  }
}

function renderBuild(target, allowMap = true) {
  const day = currentDay();
  if (!day.plan.some(entry => entry.muscle === currentMuscle)) currentMuscle = firstMuscle();
  const entry = planEntry(currentMuscle) || day.plan[0];
  const chosen = selection(currentMuscle);
  const candidates = candidateList(currentMuscle);
  const totals = workoutTotals(state.builderDay);
  const totalSelected = selectedCount();
  const complete = dayComplete();
  const visibleCandidates = filteredCandidates(candidates);
  const displayCandidates = (searchTerm || showAllForMuscle) ? visibleCandidates : visibleCandidates.slice(0, 9);

  target.innerHTML = `
    ${topbar('Gym Tracker', 'Choose the day, muscle, then the exact exercises')}
    ${renderDayTabs()}
    <div class="step-strip">
      <div class="step done"><strong>1 · Day</strong>${esc(day.name)}</div>
      <div class="step current"><strong>2 · Muscle</strong>${esc(MUSCLES[currentMuscle].label)}</div>
      <div class="step ${complete ? 'done' : ''}"><strong>3 · Exercises</strong>${totalSelected}/${totals.exercises} chosen</div>
    </div>
    <section class="hero">
      <div class="eyebrow">${esc(day.name)}</div>
      <h1>${esc(day.subtitle)}</h1>
      <p>${totals.exercises} exercises · ${totals.sets} working sets · designed for roughly an hour including normal rest.</p>
    </section>

    <section class="section">
      <div class="section-heading"><h2>Choose a muscle</h2><span>Tap the map or a muscle button</span></div>
      <div class="map-card">
        <div class="map-header">
          <strong>${esc(MUSCLES[currentMuscle].label)}</strong>
          <div class="segmented">
            <button class="button compact ${mapView === 'FRONT' ? 'teal' : ''}" type="button" data-action="map-view" data-view="FRONT">Front</button>
            <button class="button compact ${mapView === 'BACK' ? 'teal' : ''}" type="button" data-action="map-view" data-view="BACK">Back</button>
          </div>
        </div>
        <div id="bodyMap" class="body-map" data-scope="${esc(day.scope)}"></div>
        <div class="map-hint">Highlighted areas are used on ${esc(day.name)}. Tapping any part of a grouped muscle opens the same exercise list.</div>
      </div>
      <div class="muscle-chips">${day.plan.map(renderMuscleChip).join('')}</div>
    </section>

    <section id="exercisePicker" class="section">
      <div class="section-heading"><h2>Choose ${esc(MUSCLES[currentMuscle].label)}</h2><span>${candidates.length} suitable choices</span></div>
      ${renderSelectionCard(entry, chosen)}
      ${renderSelectedSlots(entry, chosen)}
      <div class="toolbar">
        <input id="exerciseSearch" class="search" type="search" value="${esc(searchTerm)}" placeholder="Search ${esc(MUSCLES[currentMuscle].label)}…" autocomplete="off">
        ${candidates.length > 9 ? `<button class="button compact" type="button" data-action="toggle-show-all">${showAllForMuscle ? 'Top picks' : `All ${candidates.length}`}</button>` : ''}
      </div>
      <div class="exercise-grid" id="exerciseGrid">
        ${displayCandidates.length ? displayCandidates.map(exercise => renderExerciseTile(exercise, currentMuscle, chosen.includes(exercise.id))).join('') : '<div class="empty" style="grid-column:1/-1">No suitable exercises found for this muscle.</div>'}
      </div>
    </section>

    <section class="section">
      <div class="section-heading"><h2>Your workout</h2><span>${totals.sets} working sets</span></div>
      <div class="summary">${day.plan.map(renderSummaryRow).join('')}</div>
    </section>

    <div class="start-bar">
      <div class="start-copy"><strong>${complete ? 'Workout ready' : 'Choose the remaining exercises'}</strong><span>${totalSelected}/${totals.exercises} exercises selected</span></div>
      <button class="button ${complete ? 'primary' : ''}" type="button" data-action="start-workout" ${complete ? '' : 'disabled'}>Start workout</button>
    </div>`;

  if (libraryStatus !== 'ready') {
    const mapEl = document.getElementById('bodyMap');
    if (mapEl) mapEl.innerHTML = libraryStatus === 'loading'
      ? '<div class="map-message"><strong>Loading exercise library…</strong></div>'
      : `<div class="error"><strong>Exercise library could not load.</strong><br>${esc(libraryError)}<br>Your existing media files have not been changed.</div>`;
    return;
  }
  if (allowMap) initMap();
}

function renderDayTabs() {
  return `<div class="day-tabs">${DAYS.map((day, index) => `
    <button class="day-tab ${index === state.builderDay ? 'active' : ''} ${index === state.rotationDay ? 'next' : ''}" type="button" data-action="select-day" data-day="${index}">${esc(day.name)}</button>
  `).join('')}</div>`;
}

function renderMuscleChip(entry) {
  const count = selection(entry.muscle).length;
  const required = entry.slotSets.length;
  return `<button class="muscle-chip ${entry.muscle === currentMuscle ? 'active' : ''} ${count >= required ? 'complete' : ''}" type="button" data-action="choose-muscle" data-muscle="${esc(entry.muscle)}">${esc(MUSCLES[entry.muscle].label)} ${count}/${required}</button>`;
}

function renderSelectionCard(entry, chosen) {
  const required = entry.slotSets.length;
  const directSets = entry.slotSets.reduce((a,b) => a+b, 0);
  const percentage = Math.min(100, Math.round((chosen.length / required) * 100));
  return `<div class="selection-card">
    <div class="selection-title">${chosen.length}/${required} selected · ${directSets} direct sets</div>
    <div class="selection-copy">${esc(volumeDescription(entry.muscle, required))}</div>
    <div class="progress-track"><span style="width:${percentage}%"></span></div>
  </div>`;
}

function volumeDescription(muscle, count) {
  if (muscle === 'biceps' && count === 2) return 'Two curl patterns give you six direct sets; rows and pulldowns add indirect biceps work.';
  if (muscle === 'triceps') return 'Direct triceps work sits on top of your pressing, so you do not need excessive isolation volume.';
  if (muscle === 'rear_delts') return 'Direct rear-delt work complements the rowing already in your pull session.';
  if (muscle === 'hips') return 'One straightforward abductor or adductor machine slot adds hip work without bloating the leg session.';
  if (count === 2) return 'Two exercises give you useful variety without filling the session with near-duplicate movements.';
  return 'One well-chosen exercise is enough here because the surrounding movements also contribute.';
}

function renderSelectedSlots(entry, chosen) {
  return `<div class="selected-slots">${entry.slotSets.map((sets, index) => {
    const id = chosen[index];
    const exercise = id ? exById(id) : null;
    return `<div class="selected-slot">
      <span class="slot-number">${index + 1}</span>
      <div class="slot-main"><div class="slot-name">${exercise ? esc(exercise.name) : 'Choose an exercise'}</div><div class="slot-detail">${sets} working sets</div></div>
      ${exercise ? `<button class="button compact" type="button" data-action="remove-selection" data-muscle="${esc(entry.muscle)}" data-id="${esc(id)}">Change</button>` : '<span></span>'}
    </div>`;
  }).join('')}</div>`;
}

function filteredCandidates(candidates) {
  if (!searchTerm) return candidates;
  const query = lower(searchTerm);
  return candidates.filter(exercise => lower(`${exercise.name} ${exercise.equipment} ${exercise.target}`).includes(query));
}

function renderExerciseTile(exercise, muscle, selected) {
  const favourite = state.prefs.fav.includes(exercise.id);
  const image = exercise.image || exercise.gif_url;
  const fallback = exercise.gif_url || exercise.image;
  return `<article class="exercise-tile ${selected ? 'selected' : ''}">
    <div class="exercise-thumb"><img src="${esc(image)}" data-fallback="${esc(fallback)}" loading="lazy" alt="${esc(exercise.name)} demonstration"></div>
    <div class="tile-actions">
      <button class="icon-button ${favourite ? 'favourite' : ''}" type="button" data-action="toggle-favourite" data-id="${esc(exercise.id)}" aria-label="${favourite ? 'Remove favourite' : 'Favourite'} ${esc(exercise.name)}">${favourite ? '★' : '☆'}</button>
      <button class="icon-button" type="button" data-action="mark-unavailable" data-id="${esc(exercise.id)}" aria-label="Mark ${esc(exercise.name)} unavailable at my gym" title="Not at my gym">⌧</button>
      <button class="icon-button" type="button" data-action="avoid-exercise" data-id="${esc(exercise.id)}" aria-label="Avoid ${esc(exercise.name)}" title="Avoid">×</button>
    </div>
    <div class="exercise-body">
      <div class="exercise-name">${esc(exercise.name)}</div>
      <div class="exercise-meta">${esc(exercise.equipment || exercise.category || 'Exercise')}</div>
      <button class="pick-button" type="button" data-action="add-selection" data-muscle="${esc(muscle)}" data-id="${esc(exercise.id)}" ${selected ? 'disabled' : ''}>${selected ? 'Selected' : 'Choose'}</button>
    </div>
  </article>`;
}

function renderSummaryRow(entry) {
  const names = selection(entry.muscle).map(id => exById(id)?.name).filter(Boolean);
  const sets = entry.slotSets.reduce((a,b) => a+b, 0);
  return `<div class="summary-row">
    <div class="summary-muscle">${esc(MUSCLES[entry.muscle].label)}</div>
    <div class="summary-names">${names.length ? names.map(esc).join('<br>') : 'Not chosen yet'}</div>
    <div class="summary-sets">${sets} sets</div>
  </div>`;
}

function renderWorkout(target) {
  if (!state.workout) {
    target.innerHTML = `${topbar('Workout', 'No active workout')}
      <section class="hero"><div class="eyebrow">Ready when you are</div><h1>Build your workout first</h1><p>Choose a day, tap each muscle, select the exercises, then start.</p><button class="button primary" type="button" data-action="go-build" style="margin-top:12px">Build workout</button></section>`;
    return;
  }

  const day = DAYS[state.workout.day];
  const counts = workoutSetCounts();
  target.innerHTML = `${topbar(day.name, `${counts.done}/${counts.total} working sets complete`)}
    <section class="hero"><div class="eyebrow">In progress</div><h1>${esc(day.subtitle)}</h1><p>Complete each set as you go. Finishing a set automatically starts the fixed 2-minute rest timer.</p></section>
    ${state.workout.items.map((item, index) => renderWorkoutCard(item, index)).join('')}
    <div class="workout-actions">
      <button class="button ${counts.done === counts.total ? 'primary' : ''}" type="button" data-action="finish-workout">Finish & save workout</button>
      <button class="button danger" type="button" data-action="discard-workout">Discard workout</button>
    </div>`;
}

function renderWorkoutCard(item, itemIndex) {
  const exercise = exById(item.exerciseId) || { name: 'Exercise unavailable', equipment: '', gif_url: '', image: '' };
  const previous = findPreviousExercise(state.history, item.exerciseId);
  const previousText = previous
    ? previous.sets.slice(-3).map(set => `${set.weight || 0}kg × ${set.reps}`).join(' · ')
    : 'No previous result';
  const completed = (item.sets || []).filter(set => set.done).length;
  const demo = exercise.gif_url || exercise.image;
  const fallback = exercise.image || exercise.gif_url;

  return `<article class="workout-card" data-item-index="${itemIndex}">
    <div class="card-header">
      <div>
        <div class="muscle-label">${esc(MUSCLES[item.muscle]?.label || item.muscle)}</div>
        <div class="exercise-title">${esc(exercise.name)}</div>
        <div class="small">${esc(exercise.equipment)} · ${item.targetSets} sets × ${esc(item.repRange)}</div>
      </div>
      <button class="button compact" type="button" data-action="open-exercise-chooser" data-item="${itemIndex}">Change</button>
    </div>
    <div class="demo">${demo ? `<img src="${esc(demo)}" data-fallback="${esc(fallback)}" alt="${esc(exercise.name)} demonstration">` : '<span class="small">Demo unavailable</span>'}</div>
    <div class="previous-line"><span>Previous: ${esc(previousText)}</span><span>${esc(item.suggestionReason || '')}</span></div>
    <div class="set-table">
      ${(item.sets || []).map((set, setIndex) => renderSetRow(itemIndex, setIndex, set)).join('')}
    </div>
    <textarea class="note" data-action="exercise-note" data-item="${itemIndex}" placeholder="Machine position, seat height, pin, grip…">${esc(item.note || '')}</textarea>
    <div class="card-footer"><span class="small">${completed}/${item.targetSets} sets complete · ticking a set starts the 2:00 rest timer</span></div>
  </article>`;
}

function renderSetRow(itemIndex, setIndex, set) {
  return `<div class="set-row">
    <div class="set-number">${setIndex + 1}</div>
    <div class="set-input"><label>WEIGHT KG</label><input type="text" inputmode="decimal" data-action="set-input" data-item="${itemIndex}" data-set="${setIndex}" data-field="weight" value="${esc(set.weight)}" placeholder="—"></div>
    <div class="set-input"><label>REPS</label><input type="number" inputmode="numeric" min="1" max="100" data-action="set-input" data-item="${itemIndex}" data-set="${setIndex}" data-field="reps" value="${esc(set.reps)}" placeholder="—"></div>
    <button class="set-done ${set.done ? 'done' : ''}" type="button" data-action="toggle-set" data-item="${itemIndex}" data-set="${setIndex}" aria-label="${set.done ? 'Mark set incomplete' : 'Complete set'}">${set.done ? '✓' : '○'}</button>
  </div>`;
}

function renderProgress(target) {
  const history = state.history || [];
  const sortedWeights = [...state.weightLog].sort((a,b) => new Date(a.date) - new Date(b.date));
  const latestWeight = sortedWeights.at(-1)?.weight;
  const completedSets = history.reduce((total, workout) => total + Number(workout.completedSets || workoutSetCounts(workout).done || 0), 0);
  target.innerHTML = `${topbar('Progress', 'History, body weight and backups')}
    <div class="stats-grid">
      <div class="stat"><strong>${history.length}</strong><span>sessions</span></div>
      <div class="stat"><strong>${completedSets}</strong><span>sets logged</span></div>
      <div class="stat"><strong>${latestWeight ? `${esc(latestWeight)} kg` : '—'}</strong><span>body weight</span></div>
    </div>
    <section class="section">
      <div class="section-heading"><h2>Body weight</h2><span>Stored locally</span></div>
      <div class="weight-entry"><input id="weightInput" type="text" inputmode="decimal" placeholder="e.g. 103.0"><button class="button teal" type="button" data-action="save-weight">Save</button></div>
      ${sortedWeights.length ? `<div class="weight-history">${sortedWeights.slice(-5).reverse().map(entry => `<span>${esc(new Date(entry.date).toLocaleDateString())} · ${esc(entry.weight)} kg</span>`).join('')}</div>` : ''}
    </section>
    <section class="section">
      <div class="section-heading"><h2>Recent workouts</h2><span>Last 12</span></div>
      ${history.length ? history.slice(-12).reverse().map(renderHistoryCard).join('') : '<div class="empty">No workouts saved yet.</div>'}
    </section>
    <section class="section">
      <div class="section-heading"><h2>Exercise preferences</h2><span>Favourite · avoid · unavailable</span></div>
      ${renderPreferenceManager()}
    </section>
    <section class="section">
      <div class="section-heading"><h2>Data</h2><span>Schema v${SCHEMA_VERSION}</span></div>
      <div class="panel data-panel"><div class="small data-summary">${state.prefs.fav.length} favourites · ${state.prefs.avoid.length} avoided · ${state.prefs.unavailable.length} unavailable${state.lastBackupAt ? ` · last backup ${esc(new Date(state.lastBackupAt).toLocaleDateString())}` : ''}</div><div class="actions">
        <button class="button" type="button" data-action="export-data">Export backup</button>
        <button class="button" type="button" data-action="import-data">Import backup</button>
        <button class="button danger" type="button" data-action="reset-app">Fresh start</button>
      </div></div>
    </section>`;
}

function renderHistoryCard(workout) {
  const day = DAYS[clampDay(workout.day)];
  const counts = workout.completedSets != null ? { done: workout.completedSets, total: workout.totalSets || workout.completedSets } : workoutSetCounts(workout);
  const rawDate = historyWorkoutDate(workout);
  const date = rawDate ? new Date(rawDate) : null;
  const pbs = Array.isArray(workout.pbs) ? workout.pbs.length : 0;
  return `<article class="history-card">
    <div class="history-head"><strong>${esc(day?.name || 'Workout')}</strong><span class="small">${date && !Number.isNaN(date.getTime()) ? esc(date.toLocaleDateString()) : '—'}</span></div>
    <div class="history-details">${counts.done}/${counts.total} sets · ${formatDuration(workout.durationSeconds)}${pbs ? ` · ${pbs} new best${pbs === 1 ? '' : 's'}` : ''}${workout.partial ? ' · partial' : ''}</div>
  </article>`;
}

function renderPreferenceManager() {
  const rows = [
    ['fav', 'Favourites', state.prefs.fav],
    ['avoid', 'Avoided', state.prefs.avoid],
    ['unavailable', 'Not at my gym', state.prefs.unavailable]
  ];
  if (!rows.some(([, , ids]) => ids.length)) return '<div class="empty">No exercise preferences set yet.</div>';
  return `<div class="preference-groups">${rows.map(([mode, label, ids]) => {
    if (!ids.length) return '';
    return `<div class="preference-group"><div class="preference-label">${esc(label)}</div>${ids.map(id => {
      const exercise = exById(id);
      return `<div class="preference-row"><span>${esc(exercise?.name || `Exercise ${id}`)}</span><button class="button compact" type="button" data-action="restore-preference" data-id="${esc(id)}">Restore</button></div>`;
    }).join('')}</div>`;
  }).join('')}</div>`;
}

function saveWeight() {
  const input = document.getElementById('weightInput');
  const weight = Number(String(input?.value || '').replace(',', '.'));
  if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
    toast('Enter a sensible body weight.');
    return;
  }
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const existing = state.weightLog.find(entry => String(entry.date).slice(0,10) === dateKey);
  if (existing) { existing.weight = weight; existing.date = now.toISOString(); }
  else state.weightLog.push({ date: now.toISOString(), weight });
  persist();
  render();
}

function exportData() {
  state.lastBackupAt = new Date().toISOString();
  persist();
  const payload = {
    app: 'gym-tracker',
    schemaVersion: SCHEMA_VERSION,
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data: state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `gym-tracker-v${APP_VERSION}-backup.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importData(file) {
  try {
    const text = (await file.text()).replace(/^\uFEFF/, '').trim();
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const nextState = parseBackupPayload(JSON.parse(cleaned));
    state = nextState;
    if (libraryStatus === 'ready') state.drafts = sanitizeDrafts(state.drafts, library, state.prefs);
    persist();
    currentMuscle = firstMuscle(state.builderDay);
    mapView = MUSCLES[currentMuscle].view;
    activeTab = state.workout ? 'workout' : 'build';
    toast('Backup imported.');
    render();
  } catch (error) {
    console.error('Backup import failed', error);
    alert(`Backup could not be imported.\n\n${error.message}`);
  }
}

function resetApp() {
  if (!confirm('Fresh start? This clears all v16 Gym Tracker data stored on this device.')) return;
  localStorage.removeItem(STORAGE_KEY);
  for (const key of LEGACY_KEYS) localStorage.removeItem(key);
  state = defaultState();
  currentMuscle = firstMuscle();
  mapView = MUSCLES[currentMuscle].view;
  activeTab = 'build';
  render();
}

function openExerciseChooser(itemIndex) {
  const item = state.workout?.items?.[itemIndex];
  if (!item) return;
  const candidates = candidateList(item.muscle).slice(0, 18);
  modalReturnFocus = document.activeElement;
  modalBody.innerHTML = `
    <div class="modal-header"><div><div class="eyebrow">${esc(MUSCLES[item.muscle].label)}</div><h2 id="modalTitle">Change exercise</h2></div><button class="button compact" type="button" data-action="close-modal">Close</button></div>
    <div class="exercise-grid">${candidates.map(exercise => `
      <article class="exercise-tile">
        <div class="exercise-thumb"><img src="${esc(exercise.image || exercise.gif_url)}" data-fallback="${esc(exercise.gif_url || exercise.image)}" loading="lazy" alt="${esc(exercise.name)} demonstration"></div>
        <div class="exercise-body"><div class="exercise-name">${esc(exercise.name)}</div><div class="exercise-meta">${esc(exercise.equipment)}</div><button class="pick-button" type="button" data-action="replace-workout-exercise" data-item="${itemIndex}" data-id="${esc(exercise.id)}">Use this</button></div>
      </article>`).join('')}</div>`;
  openModal();
}

function openModal() {
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => modal.querySelector('button, input, textarea')?.focus());
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
  modalBody.innerHTML = '';
  modalReturnFocus?.focus?.();
  modalReturnFocus = null;
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toastEl.classList.remove('show'), 1900);
}

function loadExternalScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    let settled = false;
    let timeout = null;
    const finish = (success, value) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      if (!success) script.remove();
      success ? resolve(value) : reject(value);
    };
    timeout = setTimeout(() => finish(false, new Error(`Timed out loading ${url}`)), 4500);
    script.src = url;
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.onload = () => window.BodyMuscles ? finish(true, window.BodyMuscles) : finish(false, new Error('Body Muscles loaded without its global API'));
    script.onerror = () => finish(false, new Error(`Could not load ${url}`));
    document.head.appendChild(script);
  });
}

function ensureBodyMuscles() {
  if (window.BodyMuscles) return Promise.resolve(window.BodyMuscles);
  if (bodyMusclesPromise) return bodyMusclesPromise;
  bodyMusclesPromise = (async () => {
    let lastError;
    for (const url of BODY_MUSCLES_SOURCES) {
      try { return await loadExternalScript(url); }
      catch (error) { lastError = error; console.warn(error); }
    }
    throw lastError || new Error('Anatomy library unavailable');
  })().catch(error => {
    mapLoadFailedAt = Date.now();
    console.error('Anatomy map unavailable', error);
    return null;
  });
  return bodyMusclesPromise;
}

function initMap() {
  const container = document.getElementById('bodyMap');
  if (!container || activeTab !== 'build') return;
  if (!window.BodyMuscles) {
    container.innerHTML = '<div class="map-message"><strong>Loading anatomy map…</strong><br>The muscle buttons below remain fully usable.</div>';
    ensureBodyMuscles().then(lib => {
      const current = document.getElementById('bodyMap');
      if (!current || activeTab !== 'build') return;
      if (lib) initMap();
      else current.innerHTML = '<div class="map-message"><strong>Anatomy map unavailable.</strong><br>The muscle buttons still work.<br><button class="button compact" type="button" data-action="retry-map" style="margin-top:8px">Retry map</button></div>';
    });
    return;
  }

  try {
    mapChart?.destroy?.();
    mapChart = null;
    const { BodyChart, ViewSide } = window.BodyMuscles;
    mapChart = new BodyChart(container, {
      view: mapView === 'FRONT' ? ViewSide.FRONT : ViewSide.BACK,
      bodyState: mapState(),
      showViewLabel: false,
      enableTransitions: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      ariaLabel: `${currentDay().name} ${mapView.toLowerCase()} muscle selector`,
      onMuscleClick: (id, name) => {
        const muscle = mapIdToMuscle(id, name);
        if (muscle) chooseMuscle(muscle, true);
        else toast(`That area is not part of ${currentDay().name}.`);
      }
    });
    requestAnimationFrame(() => {
      cropMap(container);
      styleMapPaths(container);
    });
  } catch (error) {
    console.error('Map render failed', error);
    container.innerHTML = '<div class="map-message">The anatomy map hit an error. Use the muscle buttons below.</div>';
  }
}

function mapState() {
  const result = {};
  for (const entry of currentDay().plan) {
    for (const id of MUSCLES[entry.muscle].mapIds) {
      result[id] = { intensity: entry.muscle === currentMuscle ? 9 : 4, selected: entry.muscle === currentMuscle };
    }
  }
  return result;
}

function mapIdToMuscle(id, name) {
  for (const entry of currentDay().plan) {
    if (MUSCLES[entry.muscle].mapIds.includes(id)) return entry.muscle;
  }
  const fallback = mapLabelToMuscle(name || id);
  return currentDay().plan.some(entry => entry.muscle === fallback) ? fallback : null;
}

function cropMap(container) {
  const svg = container.querySelector('svg');
  if (!svg) return;
  const isFront = mapView === 'FRONT';
  // Body Muscles uses x=0..35 for front and x=37..72 for back. Crop upper/lower sessions to reduce wasted phone space.
  if (currentDay().scope === 'upper') svg.setAttribute('viewBox', `${isFront ? 0 : 37} 6 35 43`);
  else svg.setAttribute('viewBox', `${isFront ? 0 : 37} 36 35 57`);
}

function styleMapPaths(container) {
  const activeMuscles = new Set(currentDay().plan.map(entry => entry.muscle));
  container.querySelectorAll('path.body-chart-muscle').forEach(path => {
    const title = path.querySelector('title')?.textContent || path.getAttribute('aria-label') || '';
    const group = mapLabelToMuscle(title);
    const active = activeMuscles.has(group);
    const selected = group === currentMuscle;
    path.style.setProperty('fill', selected ? '#4C8C8F' : active ? '#B87333' : '#5B6673', 'important');
    path.style.setProperty('fill-opacity', selected ? '1' : active ? '.86' : '.18', 'important');
    path.style.setProperty('stroke', selected ? '#F2F1EC' : '#2B2B2B', 'important');
    path.style.setProperty('stroke-width', selected ? '.3' : '.08', 'important');
    path.style.setProperty('cursor', active ? 'pointer' : 'default', 'important');
  });
}

function handleClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  switch (action) {
    case 'select-day': selectDay(button.dataset.day); break;
    case 'choose-muscle': chooseMuscle(button.dataset.muscle, true); break;
    case 'map-view': mapView = button.dataset.view === 'BACK' ? 'BACK' : 'FRONT'; render(); break;
    case 'add-selection': addSelection(button.dataset.muscle, button.dataset.id); break;
    case 'remove-selection': removeSelection(button.dataset.muscle, button.dataset.id); break;
    case 'toggle-favourite': toggleFavourite(button.dataset.id); break;
    case 'avoid-exercise': avoidExercise(button.dataset.id); break;
    case 'mark-unavailable': markUnavailable(button.dataset.id); break;
    case 'restore-preference': restoreExercisePreference(button.dataset.id); break;
    case 'retry-map': bodyMusclesPromise = null; mapLoadFailedAt = 0; initMap(); break;
    case 'toggle-show-all': showAllForMuscle = !showAllForMuscle; render(); break;
    case 'start-workout': startWorkout(); break;
    case 'go-build': setTab('build'); break;
    case 'toggle-set': toggleSet(Number(button.dataset.item), Number(button.dataset.set)); break;
    case 'end-rest': endRest(); break;
    case 'finish-workout': finishWorkout(); break;
    case 'discard-workout': discardWorkout(); break;
    case 'open-exercise-chooser': openExerciseChooser(Number(button.dataset.item)); break;
    case 'replace-workout-exercise': replaceWorkoutExercise(Number(button.dataset.item), button.dataset.id); break;
    case 'save-weight': saveWeight(); break;
    case 'export-data': exportData(); break;
    case 'import-data': importFile.click(); break;
    case 'reset-app': resetApp(); break;
    case 'close-modal': closeModal(); break;
  }
}

function handleInput(event) {
  const target = event.target;
  if (target.id === 'exerciseSearch') {
    searchTerm = target.value;
    const grid = document.getElementById('exerciseGrid');
    if (!grid) return;
    const chosen = selection(currentMuscle);
    const list = filteredCandidates(candidateList(currentMuscle));
    grid.innerHTML = list.length ? list.map(exercise => renderExerciseTile(exercise, currentMuscle, chosen.includes(exercise.id))).join('') : '<div class="empty" style="grid-column:1/-1">No matching exercises.</div>';
    return;
  }
  if (target.dataset.action === 'set-input') {
    updateSet(Number(target.dataset.item), Number(target.dataset.set), target.dataset.field, target.value);
  }
  if (target.dataset.action === 'exercise-note') {
    updateNote(Number(target.dataset.item), target.value);
  }
}

function handleImageError(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement)) return;
  const fallback = image.dataset.fallback;
  if (fallback && image.dataset.fallbackUsed !== '1' && !image.src.endsWith(fallback)) {
    image.dataset.fallbackUsed = '1';
    image.src = fallback;
    return;
  }
  image.hidden = true;
  const parent = image.parentElement;
  if (parent && !parent.querySelector('.demo-unavailable')) {
    const message = document.createElement('span');
    message.className = 'demo-unavailable';
    message.textContent = 'Demo unavailable';
    parent.appendChild(message);
  }
}

function handleKeydown(event) {
  if (modal.hidden) return;
  if (event.key === 'Escape') {
    closeModal();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.hidden && element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      registration.update().catch(() => {});
    } catch (error) {
      console.warn('Service worker registration failed', error);
    }
  });
}


window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection', event.reason);
});

document.addEventListener('click', handleClick);
document.addEventListener('input', handleInput);
document.addEventListener('error', handleImageError, true);
document.addEventListener('keydown', handleKeydown);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
importFile.addEventListener('change', event => {
  const file = event.target.files?.[0];
  if (file) importData(file);
  event.target.value = '';
});
document.querySelectorAll('.nav-button').forEach(button => button.addEventListener('click', () => setTab(button.dataset.tab)));

document.addEventListener('visibilitychange', () => { if (!document.hidden) updateRestBar(); });
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  try {
    state = validateState(JSON.parse(event.newValue));
    if (libraryStatus === 'ready') state.drafts = sanitizeDrafts(state.drafts, library, state.prefs);
    currentMuscle = firstMuscle(state.builderDay);
    mapView = MUSCLES[currentMuscle].view;
    render();
  } catch (error) {
    console.warn('Ignored invalid cross-tab Gym Tracker state', error);
  }
});

registerServiceWorker();
render();
loadLibrary();
