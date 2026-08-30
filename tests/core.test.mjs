import assert from 'node:assert/strict';
import {
  APP_VERSION, DAYS, MUSCLES, defaultState, normalizeLibrary, isAwkwardExercise,
  matchesMuscle, candidatesForMuscle, suggestWeight, validateState, parseBackupPayload,
  historyWorkoutSetCounts, mapLabelToMuscle, legacyDayIndex, sanitizeDrafts,
  setPreference, preferenceState, validSetInput
} from '../core.mjs';

function ex(id, name, role, equipment='leverage machine', extra={}) {
  return { id, filename: `${id}.gif`, name, role, equipment, category: '', target: '', muscle_group: '', secondary_muscles: [], ...extra };
}

assert.equal(APP_VERSION, '16.1.0');
assert.deepEqual(DAYS.map(d => d.name), ['Push','Legs 1','Pull','Legs 2']);
assert.equal(DAYS[0].plan.find(x => x.muscle === 'chest').slotSets.length, 2);
assert.ok(DAYS[1].plan.some(x => x.muscle === 'hips'));
assert.ok(DAYS[3].plan.some(x => x.muscle === 'hips'));
assert.ok(MUSCLES.biceps.mapIds.includes('biceps-left'));

// The common biceps curl must be treated as biceps, while a leg curl role must never leak in via the word "curl".
const bicepsCurl = ex('b1', 'dumbbell biceps curl', 'pull_biceps', 'dumbbell');
const legCurl = ex('l1', 'lever seated leg curl', 'lower_ham_curl');
assert.equal(matchesMuscle(bicepsCurl, 'biceps'), true);
assert.equal(matchesMuscle(legCurl, 'biceps'), false);
assert.equal(matchesMuscle(legCurl, 'hamstrings'), true);

// User's cable requirement: standing/seated cable stays; lying/supine/floor cable goes.
assert.equal(isAwkwardExercise(ex('c1','cable standing fly','push_fly','cable')), false);
assert.equal(isAwkwardExercise(ex('c2','cable seated row','pull_row','cable')), false);
assert.equal(isAwkwardExercise(ex('c3','cable lying triceps extension','push_triceps','cable')), true);
assert.equal(isAwkwardExercise(ex('c4','cable supine reverse fly','pull_rear','cable')), true);
assert.equal(isAwkwardExercise(ex('x1','barbell jefferson squat','lower_compound','barbell')), true);

// Candidates: simple staples first, avoid/unavailable excluded, obvious POV duplicates collapsed.
const pool = normalizeLibrary([
  ex('1','lever chest press','push_horizontal'),
  ex('2','barbell guillotine bench press','push_horizontal','barbell'),
  ex('3','dumbbell bench press','push_horizontal','dumbbell'),
  ex('4','lever chest press v. 2','push_horizontal'),
  ex('5','cable bench press','push_horizontal','cable'),
  ex('6','smith bench press','push_horizontal','smith machine'),
  ex('7','sled 45° leg press (side pov)','lower_compound','sled machine'),
  ex('8','sled 45° leg press (back pov)','lower_compound','sled machine')
]);
let chest = candidatesForMuscle(pool, 'chest', {avoid:[], unavailable:[], fav:[]});
assert.equal(chest.some(x => x.name.includes('guillotine')), false);
assert.equal(chest.some(x => x.name === 'cable bench press'), false);
assert.ok(chest[0].name.includes('chest press') || chest[0].name.includes('smith bench press'));
chest = candidatesForMuscle(pool, 'chest', {avoid:['1'], unavailable:['6'], fav:[]});
assert.equal(chest.some(x => x.id === '1' || x.id === '6'), false);
const quads = candidatesForMuscle(pool, 'quads', {avoid:[], unavailable:[], fav:[]});
assert.equal(quads.filter(x => x.name.includes('sled 45')).length, 1);

// Progression: only increase after all prescribed sets use the same working weight and hit the top of range.
const bench = ex('bench','smith bench press','push_horizontal','smith machine');
const sameTop = [{items:[{exerciseId:'bench', targetSets:3, sets:[
  {weight:'40', reps:'12', done:true}, {weight:'40', reps:'12', done:true}, {weight:'40', reps:'12', done:true}
]}]}];
assert.deepEqual(suggestWeight(sameTop, bench, 'chest', '8–12', 3), {weight:'42.5', reason:'Top of range last time · +2.5 kg'});
const mixedWeight = [{items:[{exerciseId:'bench', targetSets:3, sets:[
  {weight:'40', reps:'12', done:true}, {weight:'45', reps:'12', done:true}, {weight:'40', reps:'12', done:true}
]}]}];
assert.equal(suggestWeight(mixedWeight, bench, 'chest', '8–12', 3).weight, '40');
const short = [{items:[{exerciseId:'bench', targetSets:3, sets:[
  {weight:'40', reps:'12', done:true}, {weight:'40', reps:'12', done:true}
]}]}];
assert.equal(suggestWeight(short, bench, 'chest', '8–12', 3).weight, '40');

// State validation preserves builder day 0 even when the rotation points elsewhere.
const validated = validateState({rotationDay:2, builderDay:0, prefs:{avoid:['x','x'],fav:['y'],unavailable:['z']}});
assert.equal(validated.rotationDay, 2);
assert.equal(validated.builderDay, 0);
assert.deepEqual(validated.prefs.avoid, ['x']);
assert.deepEqual(validated.prefs.unavailable, ['z']);

// v12 backup shape imports rather than being rejected, retaining detailed set history.
const v12 = {
  app:'gym-tracker', version:'12.1', state:{
    history:[{
      version:'12.1', split:'upperPull', workoutName:'Upper Pull', isoDate:'2026-08-24T14:36:54.962Z', durationSeconds:3923,
      exercises:[{id:'2330',name:'cable lat pulldown',role:'pull_vertical',targetSets:3,targetReps:'8–12',sets:[
        {w:'17.5',r:'10',d:true},{w:'15',r:'10',d:true},{w:'15',r:'10',d:true}
      ]}]
    }],
    rotationState:{nextIndex:3},
    weightLog:[{date:'2026-08-26',weight:103}]
  }
};
const migrated = parseBackupPayload(v12);
assert.equal(migrated.rotationDay, 3);
assert.equal(migrated.history.length, 1);
assert.equal(migrated.history[0].day, 2);
assert.equal(migrated.history[0].items[0].exerciseId, '2330');
assert.deepEqual(historyWorkoutSetCounts(migrated.history[0]), {done:3,total:3});
assert.equal(migrated.weightLog[0].weight, 103);

// v13 backups had no app marker and stored preferences/notes by GIF filename.
const v13Library = normalizeLibrary([
  ex('2330','cable lat pulldown full range of motion','pull_vertical','cable',{filename:'2330-LEprlgG.gif', instructions:'Pull the bar down under control.'}),
  ex('0577','lever chest press','push_horizontal','leverage machine',{filename:'0577-T0yTjgW.gif'})
]);
const v13 = {
  version:'13.1.1',
  state:{},
  history:[{
    version:'13.1.1', sessionKey:'v9::2026-08-24::Monday', day:'Monday', split:'upperPull', workoutName:'Upper Pull',
    isoDate:'2026-08-24T14:36:54.962Z', durationSeconds:3923, prescribedSets:3,
    exercises:[{filename:'2330-LEprlgG.gif', id:'2330', name:'cable lat pulldown full range of motion', role:'pull_vertical', targetSets:3, targetReps:'8–12', sets:[
      {w:'17.5',r:'10',d:true},{w:'15',r:'10',d:true},{w:'15',r:'10',d:true}
    ]}]
  }],
  plans:{'v9::2026-08-24::Monday':{split:'upperPull'}},
  rotationState:{nextIndex:2},
  weightLog:[{date:'2026-08-26',weight:103}],
  prefs:{
    '2330-LEprlgG.gif':{favorite:true,avoid:false,unavailable:false},
    '0577-T0yTjgW.gif':{favorite:false,avoid:true,unavailable:false}
  },
  exerciseNotes:{'2330-LEprlgG.gif':'Seat on pin 4'},
  sessionStarts:{}
};
const migratedV13 = parseBackupPayload(v13, v13Library);
assert.equal(migratedV13.rotationDay, 2);
assert.equal(migratedV13.builderDay, 2);
assert.deepEqual(migratedV13.prefs.fav, ['2330']);
assert.deepEqual(migratedV13.prefs.avoid, ['0577']);
assert.equal(migratedV13.notes['2330'], 'Seat on pin 4');
assert.equal(migratedV13.history.length, 1);
assert.equal(migratedV13.history[0].items[0].exerciseId, '2330');
assert.equal(v13Library[0].instructions, 'Pull the bar down under control.');

// Decline presses are now a first-class chest role rather than being lost from the chooser.
const decline = ex('dec1','smith decline bench press','push_decline','smith machine');
assert.equal(matchesMuscle(decline, 'chest'), true);


assert.equal(legacyDayIndex({split:'legsA'}), 1);
assert.equal(legacyDayIndex({split:'lowerB'}), 3);
assert.equal(mapLabelToMuscle('Biceps left'), 'biceps');
assert.equal(mapLabelToMuscle('Trapezius mid right'), 'upper_back');
assert.equal(mapLabelToMuscle('Adductors left'), 'hips');
assert.equal(mapLabelToMuscle('Hamstrings lateral right'), 'hamstrings');

const fresh = defaultState();
assert.deepEqual(fresh.prefs, {avoid:[], unavailable:[], fav:[]});


// Draft sanitisation: stale, wrong-muscle, awkward and unavailable IDs cannot make a day look complete.
const draftPool = normalizeLibrary([
  ex('chest','lever chest press','push_horizontal'),
  ex('bis','dumbbell biceps curl','pull_biceps','dumbbell'),
  ex('weird','barbell guillotine bench press','push_horizontal','barbell')
]);
const sanitized = sanitizeDrafts({'0': {chest:['chest','bis','weird','missing','chest']}}, draftPool, {avoid:[], unavailable:[]});
assert.deepEqual(sanitized, {'0': {chest:['chest']}});
const sanitizedUnavailable = sanitizeDrafts({'0': {chest:['chest']}}, draftPool, {avoid:[], unavailable:['chest']});
assert.deepEqual(sanitizedUnavailable, {});

// Preference modes are mutually exclusive and reversible.
let prefs = {avoid:[], unavailable:[], fav:[]};
prefs = setPreference(prefs, 'x', 'fav');
assert.equal(preferenceState(prefs, 'x'), 'fav');
prefs = setPreference(prefs, 'x', 'unavailable');
assert.equal(preferenceState(prefs, 'x'), 'unavailable');
assert.deepEqual(prefs.fav, []);
prefs = setPreference(prefs, 'x', 'normal');
assert.equal(preferenceState(prefs, 'x'), 'normal');

// Logging validation permits blank weight/reps while editing, but rejects implausible committed values.
assert.equal(validSetInput('weight', ''), true);
assert.equal(validSetInput('weight', '42.5'), true);
assert.equal(validSetInput('weight', '-1'), false);
assert.equal(validSetInput('reps', ''), true);
assert.equal(validSetInput('reps', '12'), true);
assert.equal(validSetInput('reps', '101'), false);

// Every planned muscle has a map definition and at least one role.
for (const day of DAYS) {
  for (const entry of day.plan) {
    assert.ok(MUSCLES[entry.muscle]);
    assert.ok(MUSCLES[entry.muscle].mapIds.length > 0);
    assert.ok(MUSCLES[entry.muscle].roles.length > 0);
  }
}

console.log('core.test.mjs: all assertions passed');
