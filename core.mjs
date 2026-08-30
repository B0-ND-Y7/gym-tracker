export const APP_VERSION = '16.1.0';
export const SCHEMA_VERSION = 16;
export const STORAGE_KEY = 'gymtracker-v16';
export const LEGACY_KEYS = ['gymtracker-v15.2', 'gymtracker-v15'];

export const MUSCLES = {
  chest: {
    label: 'Chest',
    roles: ['push_horizontal', 'push_incline', 'push_decline', 'push_fly'],
    aliases: ['chest', 'pectorals', 'pectoral', 'pec'],
    mapIds: ['chest-upper-left','chest-upper-right','chest-lower-left','chest-lower-right'],
    view: 'FRONT'
  },
  shoulders: {
    label: 'Shoulders',
    roles: ['push_vertical', 'push_lateral'],
    aliases: ['shoulder', 'deltoid', 'delts'],
    mapIds: ['shoulder-front-left','shoulder-front-right','shoulder-side-left','shoulder-side-right'],
    view: 'FRONT'
  },
  triceps: {
    label: 'Triceps',
    roles: ['push_triceps'], aliases: ['triceps'],
    mapIds: ['triceps-long-left','triceps-lateral-left','triceps-long-right','triceps-lateral-right'],
    view: 'BACK'
  },
  biceps: {
    label: 'Biceps',
    roles: ['pull_biceps'], aliases: ['biceps','bicep','brachialis'],
    mapIds: ['biceps-left','biceps-right'], view: 'FRONT'
  },
  lats: {
    label: 'Lats',
    roles: ['pull_vertical'], aliases: ['latissimus','lats','lat pulldown','pulldown','pull-up','chin-up'],
    mapIds: ['lats-upper-left','lats-mid-left','lats-lower-left','lats-upper-right','lats-mid-right','lats-lower-right'],
    view: 'BACK'
  },
  upper_back: {
    label: 'Upper Back',
    roles: ['pull_row'], aliases: ['upper back','rhomboid','row','trapezius','trap'],
    mapIds: ['traps-upper-left','traps-mid-left','traps-lower-left','traps-upper-right','traps-mid-right','traps-lower-right'],
    view: 'BACK'
  },
  rear_delts: {
    label: 'Rear Delts',
    roles: ['pull_rear'], aliases: ['rear delt','posterior delt','reverse fly'],
    mapIds: ['deltoid-rear-left','deltoid-rear-right'], view: 'BACK'
  },
  quads: {
    label: 'Quads',
    roles: ['lower_quad','lower_compound'], aliases: ['quadriceps','quad','leg extension','leg press','hack squat'],
    mapIds: ['quads-left','quads-right'], view: 'FRONT'
  },
  hamstrings: {
    label: 'Hamstrings',
    roles: ['lower_ham_curl','lower_hinge'], aliases: ['hamstring','leg curl','romanian deadlift','stiff leg'],
    mapIds: ['hamstrings-medial-left','hamstrings-lateral-left','hamstrings-medial-right','hamstrings-lateral-right'],
    view: 'BACK'
  },
  glutes: {
    label: 'Glutes',
    roles: ['lower_glute'], aliases: ['glute','hip thrust','glute bridge'],
    mapIds: ['gluteus-medius-left','gluteus-maximus-left','gluteus-medius-right','gluteus-maximus-right'],
    view: 'BACK'
  },
  hips: {
    label: 'Hips',
    roles: ['lower_hip'], aliases: ['hip abduction','hip adduction','abductor','adductor'],
    mapIds: ['hip-flexor-left','hip-flexor-right','adductors-left','adductors-right'],
    view: 'FRONT'
  },
  calves: {
    label: 'Calves',
    roles: ['lower_calf'], aliases: ['calf','calves','gastrocnemius','soleus'],
    mapIds: ['calves-gastroc-medial-left','calves-gastroc-lateral-left','calves-soleus-left','calves-gastroc-medial-right','calves-gastroc-lateral-right','calves-soleus-right'],
    view: 'BACK'
  }
};

export const DAYS = [
  {
    id: 'push', name: 'Push', subtitle: 'Chest · shoulders · triceps', scope: 'upper', defaultView: 'FRONT',
    plan: [
      { muscle: 'chest', slotSets: [3,3] },
      { muscle: 'shoulders', slotSets: [3,2] },
      { muscle: 'triceps', slotSets: [2,2] }
    ]
  },
  {
    id: 'legs1', name: 'Legs 1', subtitle: 'Quad emphasis · whole lower body', scope: 'lower', defaultView: 'FRONT',
    plan: [
      { muscle: 'quads', slotSets: [3,3] },
      { muscle: 'hamstrings', slotSets: [3] },
      { muscle: 'glutes', slotSets: [2] },
      { muscle: 'hips', slotSets: [2] },
      { muscle: 'calves', slotSets: [3] }
    ]
  },
  {
    id: 'pull', name: 'Pull', subtitle: 'Lats · upper back · rear delts · biceps', scope: 'upper', defaultView: 'BACK',
    plan: [
      { muscle: 'lats', slotSets: [3,3] },
      { muscle: 'upper_back', slotSets: [3] },
      { muscle: 'rear_delts', slotSets: [3] },
      { muscle: 'biceps', slotSets: [3,3] }
    ]
  },
  {
    id: 'legs2', name: 'Legs 2', subtitle: 'Hamstring & glute emphasis · whole lower body', scope: 'lower', defaultView: 'BACK',
    plan: [
      { muscle: 'hamstrings', slotSets: [3,3] },
      { muscle: 'glutes', slotSets: [3,2] },
      { muscle: 'quads', slotSets: [2] },
      { muscle: 'hips', slotSets: [2] },
      { muscle: 'calves', slotSets: [3] }
    ]
  }
];

export const STAPLES = {
  chest: [
    'machine chest press','lever chest press','smith bench press','barbell bench press','dumbbell bench press',
    'incline chest press','smith incline bench press','dumbbell incline bench press','decline chest press','smith decline bench press','machine fly','pec deck','lever seated fly','cable standing fly','cable crossover'
  ],
  shoulders: [
    'lever shoulder press','machine shoulder press','smith seated shoulder press','smith shoulder press','dumbbell seated shoulder press','barbell shoulder press',
    'lever lateral raise','machine lateral raise','cable lateral raise','dumbbell lateral raise'
  ],
  triceps: ['cable triceps pushdown','triceps pushdown','rope pushdown','straight bar pushdown','overhead triceps extension','cable overhead triceps extension','lever triceps extension','machine triceps extension','lever seated dip','assisted dip'],
  biceps: ['dumbbell biceps curl','dumbbell bicep curl','standing dumbbell curl','seated dumbbell curl','dumbbell hammer curl','cable curl','cable biceps curl','cable hammer curl','lever bicep curl','machine bicep curl','lever preacher curl','preacher curl','barbell curl','ez barbell curl'],
  lats: ['lat pulldown','lateral pulldown','front pulldown','lever front pulldown','machine pulldown','assisted pull-up','assisted chin-up','straight arm pulldown'],
  upper_back: ['lever seated row','machine seated row','lever high row','machine high row','chest supported row','cable seated row','smith bent over row','t bar row','barbell row','dumbbell row'],
  rear_delts: ['lever seated reverse fly','machine reverse fly','reverse pec deck','cable rear delt row','cable reverse fly','face pull','dumbbell reverse fly','rear delt raise'],
  quads: ['leg press','45 leg press','hack squat','smith squat','smith full squat','leg extension','machine leg extension','smith leg press','barbell squat','goblet squat'],
  hamstrings: ['seated leg curl','lying leg curl','machine leg curl','romanian deadlift','smith romanian deadlift','dumbbell romanian deadlift','barbell romanian deadlift','stiff leg deadlift','back extension'],
  glutes: ['hip thrust','machine hip thrust','lever hip thrust','smith hip thrust','barbell hip thrust','glute drive','glute kickback'],
  hips: ['seated hip abduction','seated hip adduction','machine hip abduction','machine hip adduction','hip abduction','hip adduction'],
  calves: ['seated calf raise','machine seated calf raise','standing calf raise','machine standing calf raise','smith standing leg calf raise','leg press calf raise','hack calf raise']
};

export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    rotationDay: 0,
    builderDay: 0,
    drafts: {},
    workout: null,
    history: [],
    prefs: { avoid: [], unavailable: [], fav: [] },
    notes: {},
    weightLog: [],
    restUntil: 0,
    settings: { showAllExercises: false },
    lastBackupAt: null
  };
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
}

export function lower(value) { return String(value ?? '').toLowerCase(); }

export function normalizeExercise(raw, key = '') {
  const id = String(raw?.id ?? key ?? '').trim();
  const filename = String(raw?.filename ?? key ?? '').trim();
  const name = String(raw?.name ?? raw?.title ?? filename ?? id).trim();
  if (!id || !name) return null;
  const secondary = Array.isArray(raw?.secondary_muscles) ? raw.secondary_muscles.map(String) : [];
  return {
    id,
    filename,
    name,
    category: String(raw?.category ?? ''),
    equipment: String(raw?.equipment ?? ''),
    target: String(raw?.target ?? ''),
    muscle_group: String(raw?.muscle_group ?? raw?.muscleGroup ?? ''),
    secondary_muscles: secondary,
    role: String(raw?.role ?? ''),
    instructions: typeof raw?.instructions === 'string'
      ? raw.instructions
      : String(raw?.instructions?.en ?? raw?.instruction ?? ''),
    image: String(raw?.image ?? (filename ? `images/${filename.replace(/\.gif$/i,'.jpg')}` : '')),
    gif_url: String(raw?.gif_url ?? (filename ? `videos/${filename}` : ''))
  };
}

export function normalizeLibrary(payload) {
  const rows = Array.isArray(payload)
    ? payload.map((value, index) => normalizeExercise(value, value?.filename || String(index)))
    : Object.entries(payload || {}).map(([key, value]) => normalizeExercise(value, key));
  const byId = new Map();
  for (const exercise of rows) {
    if (!exercise || byId.has(exercise.id)) continue;
    byId.set(exercise.id, exercise);
  }
  return [...byId.values()];
}

export function exerciseText(exercise) {
  return lower([
    exercise?.name, exercise?.target, exercise?.muscle_group, exercise?.category, exercise?.equipment,
    exercise?.role
  ].filter(Boolean).join(' '));
}

export function isAwkwardExercise(exercise) {
  const name = lower(exercise?.name);
  const equipment = lower(exercise?.equipment);
  const cable = equipment.includes('cable') || exerciseText(exercise).includes('cable');

  // User's gym setup: keep standing/seated cable work, exclude cable movements that require lying on a bench/floor.
  if (cable && /(lying|supine|on floor|floor|bench press|incline fly|decline fly)/.test(name)) return true;

  // Keep the default pool conventional and easy to set up. These can still be reintroduced later if wanted.
  return /(behind head|guillotine|jefferson|arm blaster|kayak row|biceps curl squat|standing twist row|side plank|side bridge|self assisted inverse|inverse leg curl|glute bridge march|two legs on bench|turkish|get-up|pistol squat|sissy squat|cossack|handstand|renegade row)/.test(name);
}

export function matchesMuscle(exercise, muscle) {
  const cfg = MUSCLES[muscle];
  if (!cfg || !exercise) return false;
  const role = String(exercise.role || '').trim();
  // If the library already classified the exercise, trust the role. Do not let secondary-muscle text leak it into another group.
  if (role) return cfg.roles.includes(role);
  const primaryText = lower([exercise.name, exercise.target, exercise.category, exercise.muscle_group].filter(Boolean).join(' '));
  return cfg.aliases.some(alias => primaryText.includes(alias));
}

export function canonicalExerciseKey(exercise) {
  let name = lower(exercise?.name)
    .replace(/\([^)]*pov[^)]*\)/g, '')
    .replace(/\(male\)/g, '')
    .replace(/\bv\.?\s*\d+\b/g, '')
    .replace(/\bversion\s*\d+\b/g, '')
    .replace(/[°в]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `${lower(exercise?.equipment)}|${name}`;
}

export function exerciseScore(exercise, muscle, prefs = {fav:[]}) {
  const name = lower(exercise?.name);
  const equipment = lower(exercise?.equipment);
  let score = 0;
  if (prefs?.fav?.includes(exercise.id)) score += 1000;

  // Prefer the equipment the user actually has and likes. Smith is deliberately near the top.
  if (/smith/.test(equipment)) score += 155;
  else if (/leverage machine|selectorized|plate loaded|sled machine|machine/.test(equipment)) score += 160;
  else if (/cable/.test(equipment)) score += 125;
  else if (/dumbbell/.test(equipment)) score += 110;
  else if (/ez barbell|ez-bar/.test(equipment)) score += 105;
  else if (/barbell/.test(equipment)) score += 100;
  else if (/body weight/.test(equipment)) score -= 45;

  for (const [index, staple] of (STAPLES[muscle] || []).entries()) {
    if (name.includes(staple)) {
      score += 520 - index * 12;
      break;
    }
  }

  if (/standing/.test(name) && /cable/.test(equipment)) score += 24;
  if (/seated/.test(name) && /machine|cable/.test(equipment)) score += 16;
  if (/ v\.?\s*\d|reverse grip|wide grip|close grip|alternate|unilateral|twist|rotation|pov/.test(name)) score -= 24;
  if (/full range of motion/.test(name)) score += 8;
  return score;
}

export function candidatesForMuscle(library, muscle, prefs = {avoid:[],fav:[]}) {
  const avoid = new Set((prefs?.avoid || []).map(String));
  const unavailable = new Set((prefs?.unavailable || []).map(String));
  const sorted = library
    .filter(exercise => !avoid.has(exercise.id) && !unavailable.has(exercise.id))
    .filter(exercise => !isAwkwardExercise(exercise))
    .filter(exercise => matchesMuscle(exercise, muscle))
    .sort((a,b) => exerciseScore(b,muscle,prefs) - exerciseScore(a,muscle,prefs) || a.name.localeCompare(b.name));

  const seen = new Set();
  const output = [];
  for (const exercise of sorted) {
    const key = canonicalExerciseKey(exercise);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(exercise);
  }
  return output;
}

export function repRangeFor(exercise, muscle) {
  if (['rear_delts','calves','hips'].includes(muscle)) return '10–15';
  if (['biceps','triceps'].includes(muscle)) return '8–12';
  if (['push_lateral','push_fly','pull_rear','lower_hip','lower_calf'].includes(exercise?.role)) return '10–15';
  return '8–12';
}

export function parseRepRange(range) {
  const values = String(range || '').match(/\d+/g)?.map(Number) || [];
  return { min: values[0] || 8, max: values[1] || values[0] || 12 };
}

export function weightIncrementFor(exercise, muscle) {
  const role = String(exercise?.role || '');
  if (muscle === 'quads' && role === 'lower_compound') return 5;
  if (['hamstrings','glutes'].includes(muscle) && /barbell|smith|sled|machine/.test(lower(exercise?.equipment))) return 5;
  return 2.5;
}

export function completedSetsFromHistoryItem(item) {
  if (Array.isArray(item?.sets)) {
    return item.sets.filter(set => set?.done).map(set => ({ weight: Number(set.weight ?? set.w), reps: Number(set.reps ?? set.r) }));
  }
  // v15 compatibility: one working weight and an exercise-level completion flag.
  if (item?.completed && item?.weight !== '' && item?.weight != null) {
    const reps = parseRepRange(item.reps).min;
    return [{ weight: Number(item.weight), reps }];
  }
  return [];
}

export function findPreviousExercise(history, exerciseId) {
  for (let workoutIndex = (history?.length || 0) - 1; workoutIndex >= 0; workoutIndex--) {
    const rows = history[workoutIndex]?.items || history[workoutIndex]?.exercises || [];
    const item = rows.find(row => String(row.exerciseId ?? row.id ?? row.filename) === String(exerciseId));
    if (!item) continue;
    const sets = completedSetsFromHistoryItem(item);
    if (sets.length) return { workout: history[workoutIndex], item, sets };
  }
  return null;
}

export function suggestWeight(history, exercise, muscle, repRange, targetSets) {
  const previous = findPreviousExercise(history, exercise?.id);
  if (!previous) return { weight: '', reason: 'No previous result' };
  const usable = previous.sets.filter(set => Number.isFinite(set.weight) && set.weight >= 0 && Number.isFinite(set.reps) && set.reps > 0);
  if (!usable.length) return { weight: '', reason: 'No previous working weight' };
  const lastWeight = usable[usable.length - 1].weight;
  const { max } = parseRepRange(repRange);
  const prescribed = Number(previous.item?.targetSets || (Array.isArray(previous.item?.sets) ? previous.item.sets.length : 0) || targetSets || usable.length);
  const completedEnough = usable.length >= prescribed;
  const prescribedSets = usable.slice(0, prescribed);
  const sameWorkingWeight = prescribedSets.length > 0 && prescribedSets.every(set => Math.abs(set.weight - lastWeight) < 0.001);
  const allAtTop = completedEnough && sameWorkingWeight && prescribedSets.every(set => set.reps >= max);
  const weight = allAtTop ? lastWeight + weightIncrementFor(exercise, muscle) : lastWeight;
  return {
    weight: Number.isInteger(weight) ? String(weight) : String(Number(weight.toFixed(2))),
    reason: allAtTop ? `Top of range last time · +${weightIncrementFor(exercise,muscle)} kg` : 'Repeat your last working weight'
  };
}

export function workoutTotals(dayIndex) {
  const day = DAYS[Number(dayIndex) || 0];
  return day.plan.reduce((totals, entry) => {
    totals.exercises += entry.slotSets.length;
    totals.sets += entry.slotSets.reduce((a,b) => a+b, 0);
    return totals;
  }, { exercises: 0, sets: 0 });
}

export function legacyDayIndex(workout) {
  const label = lower([workout?.split, workout?.workoutName, workout?.name].filter(Boolean).join(' '));
  if (/upper.?push|\bpush\b/.test(label)) return 0;
  if (/legs.?a|legs.?1|quad/.test(label)) return 1;
  if (/upper.?pull|\bpull\b/.test(label)) return 2;
  if (/lower.?b|legs.?2|posterior/.test(label)) return 3;
  const day = Number(workout?.day);
  return Number.isInteger(day) && day >= 0 && day < DAYS.length ? day : 0;
}

export function historyWorkoutSetCounts(workout) {
  if (!workout || typeof workout !== 'object') return { done: 0, total: 0 };
  if (Number.isFinite(Number(workout.completedSets)) && Number.isFinite(Number(workout.totalSets))) {
    return { done: Number(workout.completedSets), total: Number(workout.totalSets) };
  }
  const rows = workout.items || workout.exercises || [];
  let done = 0;
  let total = 0;
  for (const item of rows) {
    if (Array.isArray(item?.sets)) {
      total += item.sets.length;
      done += item.sets.filter(set => set?.done ?? set?.d).length;
    } else {
      const count = Number(item?.targetSets ?? item?.sets ?? 0) || 0;
      total += count;
      if (item?.completed) done += count;
    }
  }
  return { done, total };
}

export function historyWorkoutDate(workout) {
  return workout?.finishedAt || workout?.finished || workout?.isoDate || workout?.date || null;
}

function normaliseWorkout(workout) {
  if (!workout || typeof workout !== 'object') return null;
  if (Array.isArray(workout.items)) return workout;
  // v12 history used `exercises`; keep its detailed set records but give v16 a common `items` alias.
  if (Array.isArray(workout.exercises)) {
    return {
      ...workout,
      day: legacyDayIndex(workout),
      items: workout.exercises.map(item => ({
        ...item,
        exerciseId: String(item.exerciseId ?? item.id ?? item.filename ?? ''),
        targetSets: Number(item.targetSets || item.sets?.length || 0),
        repRange: item.repRange || item.targetReps || '8–12',
        sets: Array.isArray(item.sets) ? item.sets.map(set => ({
          weight: String(set.weight ?? set.w ?? ''),
          reps: String(set.reps ?? set.r ?? ''),
          done: Boolean(set.done ?? set.d)
        })) : []
      })),
      finishedAt: historyWorkoutDate(workout) ? new Date(historyWorkoutDate(workout)).getTime() : undefined
    };
  }
  return workout;
}

export function validateState(candidate) {
  const base = defaultState();
  if (!candidate || typeof candidate !== 'object') return base;
  const prefs = candidate?.prefs || {};
  const history = Array.isArray(candidate?.history) ? candidate.history.map(normaliseWorkout).filter(Boolean) : [];
  const inferredRotation = candidate?.rotationState?.nextIndex ?? candidate?.rotationDay ?? 0;
  const incomingWorkout = candidate?.workout && Number(candidate?.schemaVersion) === SCHEMA_VERSION ? candidate.workout : null;

  const result = {
    ...base,
    ...candidate,
    schemaVersion: SCHEMA_VERSION,
    rotationDay: inferredRotation,
    workout: incomingWorkout,
    prefs: {
      avoid: Array.isArray(prefs.avoid) ? [...new Set(prefs.avoid.map(String))] : [],
      unavailable: Array.isArray(prefs.unavailable) ? [...new Set(prefs.unavailable.map(String))] : [],
      fav: Array.isArray(prefs.fav) ? [...new Set(prefs.fav.map(String))] : []
    },
    notes: candidate?.notes && typeof candidate.notes === 'object' ? candidate.notes : {},
    drafts: candidate?.drafts && typeof candidate.drafts === 'object' ? candidate.drafts : {},
    history,
    weightLog: Array.isArray(candidate?.weightLog) ? candidate.weightLog : [],
    settings: { ...base.settings, ...(candidate?.settings || {}) },
    lastBackupAt: candidate?.lastBackupAt || null
  };
  const rotationNumber = Number(result.rotationDay);
  result.rotationDay = Math.max(0, Math.min(3, Number.isFinite(rotationNumber) ? rotationNumber : 0));
  const builderNumber = Number(result.builderDay);
  result.builderDay = Math.max(0, Math.min(3, Number.isFinite(builderNumber) ? builderNumber : result.rotationDay));
  result.restUntil = Math.max(0, Number(result.restUntil) || 0);
  return result;
}

function legacyIdResolver(library = []) {
  const lookup = new Map();
  for (const exercise of library || []) {
    const id = String(exercise?.id ?? '');
    const filename = String(exercise?.filename ?? '');
    if (id) lookup.set(id, id);
    if (filename) lookup.set(filename, id || filename);
  }
  return value => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    if (lookup.has(raw)) return lookup.get(raw);
    // The historical GIF filename starts with the dataset exercise ID (e.g. 2330-LEprlgG.gif).
    // Preserve that stable ID even when the exercise is not in the currently curated library.
    const filenameId = raw.match(/^(\d{3,})[-_.]/)?.[1];
    return filenameId || raw;
  };
}

function migrateV13Preferences(rawPrefs, resolveId) {
  const next = { avoid: [], unavailable: [], fav: [] };
  if (!rawPrefs || typeof rawPrefs !== 'object' || Array.isArray(rawPrefs)) return next;
  for (const [legacyKey, pref] of Object.entries(rawPrefs)) {
    if (!pref || typeof pref !== 'object') continue;
    const id = resolveId(legacyKey);
    if (!id) continue;
    if (pref.avoid) next.avoid.push(id);
    else if (pref.unavailable) next.unavailable.push(id);
    else if (pref.favorite || pref.favourite) next.fav.push(id);
  }
  for (const key of Object.keys(next)) next[key] = [...new Set(next[key].map(String))];
  return next;
}

function migrateV13Notes(rawNotes, resolveId) {
  const notes = {};
  if (!rawNotes || typeof rawNotes !== 'object' || Array.isArray(rawNotes)) return notes;
  for (const [legacyKey, value] of Object.entries(rawNotes)) {
    if (typeof value !== 'string') continue;
    const id = resolveId(legacyKey);
    if (id) notes[id] = value;
  }
  return notes;
}

export function parseBackupPayload(payload, library = []) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Backup is not valid JSON data.');

  // v16+ backups are wrapped with an app marker and a single state object.
  if (payload.app === 'gym-tracker') {
    const data = payload.data || payload.state;
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Backup does not contain Gym Tracker state.');
    return validateState(data);
  }

  // v12/v13 exported the individual stores at the top level rather than using an app marker.
  // Keep completed history, weights, rotation, exercise notes and preferences. Old active
  // plans are intentionally not restored because the workout schema changed in v16.
  const looksLikeLegacyTopLevel = /^13(?:\.|$)/.test(String(payload.version || ''))
    || (Array.isArray(payload.history) && payload.rotationState && Object.prototype.hasOwnProperty.call(payload, 'plans'));
  if (looksLikeLegacyTopLevel) {
    const resolveId = legacyIdResolver(library);
    const rotationDay = Number(payload?.rotationState?.nextIndex ?? 0);
    const candidate = {
      schemaVersion: SCHEMA_VERSION,
      rotationDay,
      builderDay: rotationDay,
      drafts: {},
      workout: null,
      history: Array.isArray(payload.history) ? payload.history : [],
      prefs: migrateV13Preferences(payload.prefs, resolveId),
      notes: migrateV13Notes(payload.exerciseNotes, resolveId),
      weightLog: Array.isArray(payload.weightLog) ? payload.weightLog : [],
      restUntil: 0,
      settings: { showAllExercises: false },
      lastBackupAt: null
    };
    return validateState(candidate);
  }

  // v12 and a few development builds were sometimes exported as raw state objects.
  if (Array.isArray(payload.history) || payload.rotationDay != null || payload.rotationState?.nextIndex != null) {
    return validateState(payload);
  }

  throw new Error('This backup format is not recognised as a Gym Tracker backup.');
}

export function mapLabelToMuscle(label) {
  const value = lower(label);
  if (/rear.*deltoid|deltoid.*rear|posterior.*deltoid|deltoid.*posterior/.test(value)) return 'rear_delts';
  if (/triceps/.test(value)) return 'triceps';
  if (/biceps/.test(value)) return 'biceps';
  if (/latissimus|\blats?\b/.test(value)) return 'lats';
  if (/trapezius|\btraps?\b|rhomboid|upper back/.test(value)) return 'upper_back';
  if (/shoulder|deltoid/.test(value)) return 'shoulders';
  if (/chest|pectoral/.test(value)) return 'chest';
  if (/quadriceps|\bquads?\b/.test(value)) return 'quads';
  if (/hamstring/.test(value)) return 'hamstrings';
  if (/glute/.test(value)) return 'glutes';
  if (/adductor|hip flexor|groin/.test(value)) return 'hips';
  if (/calf|calves|gastrocnemius|soleus/.test(value)) return 'calves';
  return null;
}

export function sanitizeDrafts(drafts, library, prefs = {avoid:[], unavailable:[]}) {
  const source = drafts && typeof drafts === 'object' ? drafts : {};
  const byId = new Map((library || []).map(exercise => [String(exercise.id), exercise]));
  const avoided = new Set((prefs?.avoid || []).map(String));
  const unavailable = new Set((prefs?.unavailable || []).map(String));
  const cleaned = {};
  for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex++) {
    const dayDraft = source[String(dayIndex)];
    if (!dayDraft || typeof dayDraft !== 'object') continue;
    const nextDay = {};
    for (const entry of DAYS[dayIndex].plan) {
      const seen = new Set();
      const ids = Array.isArray(dayDraft[entry.muscle]) ? dayDraft[entry.muscle] : [];
      const valid = [];
      for (const rawId of ids) {
        const id = String(rawId);
        if (seen.has(id)) continue;
        const exercise = byId.get(id);
        if (!exercise) continue;
        if (isAwkwardExercise(exercise) || !matchesMuscle(exercise, entry.muscle)) continue;
        if (avoided.has(id) || unavailable.has(id)) continue;
        seen.add(id);
        valid.push(id);
        if (valid.length >= entry.slotSets.length) break;
      }
      if (valid.length) nextDay[entry.muscle] = valid;
    }
    if (Object.keys(nextDay).length) cleaned[String(dayIndex)] = nextDay;
  }
  return cleaned;
}

export function preferenceState(prefs, exerciseId) {
  const id = String(exerciseId);
  if ((prefs?.unavailable || []).map(String).includes(id)) return 'unavailable';
  if ((prefs?.avoid || []).map(String).includes(id)) return 'avoid';
  if ((prefs?.fav || []).map(String).includes(id)) return 'fav';
  return 'normal';
}

export function setPreference(prefs, exerciseId, mode = 'normal') {
  const id = String(exerciseId);
  const next = {
    avoid: [...new Set((prefs?.avoid || []).map(String).filter(value => value !== id))],
    unavailable: [...new Set((prefs?.unavailable || []).map(String).filter(value => value !== id))],
    fav: [...new Set((prefs?.fav || []).map(String).filter(value => value !== id))]
  };
  if (mode === 'avoid') next.avoid.push(id);
  else if (mode === 'unavailable') next.unavailable.push(id);
  else if (mode === 'fav') next.fav.push(id);
  return next;
}

export function validSetInput(field, value) {
  if (field === 'weight') {
    if (String(value ?? '').trim() === '') return true;
    const number = Number(String(value).replace(',', '.'));
    return Number.isFinite(number) && number >= 0 && number <= 1000;
  }
  if (field === 'reps') {
    if (String(value ?? '').trim() === '') return true;
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= 100;
  }
  return false;
}
