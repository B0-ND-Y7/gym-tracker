#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re, shutil, sys
from pathlib import Path

TARGET_COUNT = 250

ROLE_SPECS = {
    "push_horizontal": {"quota":18,"category_any":["chest"],"any":[["chest","press"],["bench","press"]],"prefer":["leverage machine","smith machine","dumbbell","barbell","cable"],"boost":["seated","lever","machine","horizontal","smith"],"exclude":["incline","decline","single arm","one arm","alternating","close grip","floor","ball","kneeling"]},
    "push_incline": {"quota":14,"category_any":["chest"],"all":["incline","press"],"prefer":["leverage machine","smith machine","dumbbell","barbell"],"boost":["chest","bench","smith","machine"],"exclude":["single arm","one arm","alternating","ball","kneeling"]},
    "push_fly": {"quota":12,"category_any":["chest"],"any":[["fly"],["crossover"],["pec","deck"]],"prefer":["leverage machine","cable","dumbbell"],"boost":["chest","seated","standing","machine"],"exclude":["reverse","rear","single arm","one arm","ball","kneeling"]},
    "push_vertical": {"quota":14,"category_any":["shoulders"],"any":[["shoulder","press"],["military","press"]],"prefer":["leverage machine","smith machine","dumbbell","barbell"],"boost":["seated","machine","lever","smith"],"exclude":["single arm","one arm","alternating","behind neck","ball","kneeling"]},
    "push_lateral": {"quota":10,"category_any":["shoulders"],"all":["lateral","raise"],"prefer":["leverage machine","cable","dumbbell"],"boost":["seated","lever","machine"],"exclude":["bent","rear","single arm","one arm","ball","kneeling"]},
    "push_triceps": {"quota":18,"category_any":["upper arms"],"meta_any":["triceps","tricep"],"any":[["triceps","pushdown"],["triceps","extension"],["tricep","pushdown"],["tricep","extension"],["assisted","dip"],["dip"]],"prefer":["cable","leverage machine","assisted","ez barbell","dumbbell","smith machine"],"boost":["rope","bar","seated","lever","machine","smith"],"exclude":["single arm","one arm","kickback","bench dip","ball","kneeling"]},
    "pull_vertical": {"quota":14,"category_any":["back"],"any":[["pulldown"],["pull up"],["pullup"],["chin up"],["chinup"]],"prefer":["cable","leverage machine","assisted"],"boost":["lat","wide","neutral","close grip","assisted","machine"],"exclude":["single arm","one arm","behind neck","straight arm","band","kneeling"]},
    "pull_row": {"quota":20,"category_any":["back"],"any":[["row"]],"prefer":["leverage machine","cable","smith machine","dumbbell","barbell"],"boost":["seated","chest supported","lever","machine","smith"],"exclude":["upright row","single arm","one arm","renegade","inverted","ball","kneeling"]},
    "pull_rear": {"quota":12,"category_any":["shoulders","back"],"any":[["reverse","fly"],["rear","delt"],["face","pull"]],"prefer":["leverage machine","cable","dumbbell"],"boost":["seated","machine","lever"],"exclude":["single arm","one arm","ball","kneeling"]},
    "pull_biceps": {"quota":18,"category_any":["upper arms"],"meta_any":["biceps","bicep","brachialis"],"any":[["curl"]],"prefer":["leverage machine","cable","ez barbell","dumbbell","barbell"],"boost":["preacher","biceps","seated","lever","machine","hammer","smith"],"exclude":["wrist","reverse wrist","single arm","one arm","concentration","ball","zottman","leg curl","wrist curl","reverse curl","kneeling"]},
    "lower_compound": {"quota":25,"category_any":["upper legs"],"any":[["leg","press"],["hack","squat"],["smith","squat"],["belt","squat"],["squat"]],"prefer":["sled machine","leverage machine","smith machine","barbell","dumbbell"],"boost":["45","hack","smith","lever","machine","seated"],"exclude":["single leg","one leg","pistol","sissy","jump","overhead","front squat","calf","cossack","curtsy","curtsey","split","zercher"]},
    "lower_quad": {"quota":15,"category_any":["upper legs"],"meta_any":["quadriceps","quads"],"any":[["leg","extension"],["quad","extension"]],"prefer":["leverage machine","cable"],"boost":["lever","machine","seated"],"exclude":["single leg","one leg","band","kneeling"]},
    "lower_ham_curl": {"quota":15,"category_any":["upper legs"],"meta_any":["hamstrings","hamstring"],"all":["leg","curl"],"prefer":["leverage machine","cable"],"boost":["seated","lying","lever","machine"],"exclude":["single leg","one leg","ball","band","kneeling"]},
    "lower_hinge": {"quota":10,"category_any":["upper legs","back"],"any":[["romanian","deadlift"],["stiff","leg","deadlift"],["stiff","legged","deadlift"],["back","extension"]],"prefer":["smith machine","barbell","dumbbell","leverage machine","weighted"],"boost":["smith","45","lever","machine","seated"],"exclude":["single leg","one leg","kettlebell","band","ball","kneeling"]},
    "lower_glute": {"quota":12,"category_any":["upper legs"],"meta_any":["glute","glutes","gluteus"],"any":[["hip","thrust"],["glute","bridge"],["glute","drive"]],"prefer":["leverage machine","smith machine","barbell","weighted"],"boost":["lever","machine","smith","seated"],"exclude":["single leg","one leg","band","ball","kneeling"]},
    "lower_hip": {"quota":8,"category_any":["upper legs"],"any":[["hip","abduction"],["hip","adduction"],["abductor"],["adductor"]],"prefer":["leverage machine","cable"],"boost":["seated","lever","machine"],"exclude":["single leg","one leg","band","lying","kneeling"]},
    "lower_calf": {"quota":5,"category_any":["lower legs"],"meta_any":["calves","calf","gastrocnemius","soleus"],"all":["calf","raise"],"prefer":["leverage machine","sled machine","smith machine","dumbbell"],"boost":["standing","seated","lever","machine","smith"],"exclude":["single leg","one leg","donkey","jump"]},
    "core": {"quota":10,"category_any":["waist"],"any":[["ab","crunch"],["crunch"],["cable","crunch"],["machine","crunch"],["torso","rotation"],["wood","chop"]],"prefer":["leverage machine","cable","smith machine"],"boost":["seated","machine","cable","weighted"],"exclude":["dragon","wheel","rollout","v-up","jackknife","hanging","windshield","kneeling","ball","single arm"]},
}

ROLE_RECOMMENDED_MIN = {
    "push_horizontal":8,"push_incline":6,"push_fly":5,"push_vertical":7,"push_lateral":5,"push_triceps":8,
    "pull_vertical":7,"pull_row":10,"pull_rear":6,"pull_biceps":8,
    "lower_compound":12,"lower_quad":5,"lower_ham_curl":6,"lower_hinge":5,"lower_glute":6,"lower_hip":4,"lower_calf":3,
    "core":4,
}

ALLOWED_EQUIPMENT={"leverage machine","cable","sled machine","smith machine","dumbbell","barbell","ez barbell","assisted","weighted","body weight","other"}
GLOBAL_EXCLUDE=["kettlebell","band","stability ball","bosu","medicine ball","resistance band","jump","burpee","handstand","muscle up","snatch","clean and jerk","olympic","pistol","sissy","dragon flag","wheel rollout","neck","wrist roller","turkish get up","turkish get-up","windmill","renegade","cossack","curtsy","curtsey","single leg","one leg","single arm","one arm","alternating","behind neck","upright row","good morning","sissy squat"]

# These are searched against the user's full 1,324-entry lookup. The first good
# match is used. If a particular movement is not present, the app falls back to clear text guidance.
PREP_SPECS = {
    # Dynamic prep: prefer simple body-weight movements and reject machine/
    # resistance variants that merely happen to contain the same words.
    "arm_circles": {"patterns":[["arm","circle"],["shoulder","circle"],["arm","rotation"]],"exclude":["roller","cable","dumbbell","barbell","band","machine","lying","internal","external"]},
    "shoulder_rolls": {"patterns":[["shoulder","roll"],["shoulder","circle"]],"exclude":["roller","flexor","depressor","retractor","cable","band","machine","lying"]},
    "chest_opener": {"patterns":[["dynamic","chest","stretch"],["arm","swing"],["chest","opener"]],"exclude":["machine","cable","dumbbell","barbell"]},
    "thoracic_rotation": {"patterns":[["thoracic","rotation"],["upper","back","rotation"],["reach","to","sky"],["thread","needle"],["torso","rotation"]],"exclude":["machine","cable","band","weighted"]},
    "scapular_push": {"patterns":[["scapular","push"],["scapula","push"]],"exclude":["machine","cable"]},
    "scapular_pull": {"patterns":[["scapular","pull"],["scapula","pull"]],"exclude":["machine","cable"]},
    "leg_swings": {"patterns":[["leg","swing"],["walking","high","kick"],["straight","leg","kick"]],"exclude":["cable","band","machine","lying","weighted"]},
    "walking_lunge": {"patterns":[["walking","lunge"],["forward","lunge"]],"exclude":["jump","barbell","dumbbell","weighted","smith"]},
    "bodyweight_squat": {"patterns":[["bodyweight","squat"],["body","weight","squat"],["air","squat"]],"require_equipment":["body weight"],"exclude":["jump","drop","plyometric","pistol","sissy","split","curtsey","curtsy","cossack","barbell","dumbbell","smith","hack","row","rowing","pull"]},
    "hip_circles": {"patterns":[["hip","circle"],["standing","hip","rotation"],["hip","opener"]],"exclude":["band","cable","machine","lying","internal","external","ball","weighted"]},
    "knee_hugs": {"patterns":[["walking","knee","hug"],["knee","hug"],["walking","leg","cradle"]],"exclude":["machine","cable","band","lying"]},
    "high_knees": {"patterns":[["high","knees"],["high","knee"]],"exclude":["wall","machine","cable","band","walking","lunge","row","lying"]},
    "ankle_circles": {"patterns":[["ankle","circle"],["ankle","rotation"]],"exclude":["band","machine","cable","weighted"]},

    # Post-workout static stretches: prefer simple standing/kneeling/floor
    # versions rather than ball, band or machine variants.
    "chest_stretch": {"patterns":[["chest","stretch"],["front","shoulder","stretch"]],"exclude":["ball","band","machine","cable"]},
    "shoulder_stretch": {"patterns":[["cross","body","shoulder"],["posterior","shoulder","stretch"],["rear","deltoid","stretch"],["shoulder","stretch"]],"exclude":["ball","band","machine","cable","roller"]},
    "triceps_stretch": {"patterns":[["overhead","triceps","stretch"],["triceps","stretch"]],"exclude":["ball","band","machine","cable"]},
    "lat_stretch": {"patterns":[["kneeling","lat","stretch"],["lat","stretch"],["lats","stretch"]],"exclude":["ball","band","machine","cable","weighted"]},
    "hamstring_stretch": {"patterns":[["standing","hamstring","stretch"],["seated","hamstring","stretch"],["hamstring","stretch"],["runner","stretch"]],"exclude":["ball","band","machine","cable","weighted"]},
    "quad_stretch": {"patterns":[["standing","quadriceps","stretch"],["standing","quad","stretch"],["lying","quadriceps","stretch"],["quad","stretch"],["quadriceps","stretch"]],"exclude":["all fours","squad","ball","band","machine","cable"]},
    "calf_stretch": {"patterns":[["standing","calf","stretch"],["calf","stretch"],["posterior","tibialis","stretch"]],"exclude":["ball","band","machine","cable","weighted"]},
    "glute_stretch": {"patterns":[["seated","glute","stretch"],["lying","glute","stretch"],["glute","stretch"]],"exclude":["ball","band","machine","cable","weighted"]},
    "hip_flexor_stretch": {"patterns":[["kneeling","hip","flexor"],["standing","hip","flexor"],["hip","flexor","stretch"]],"exclude":["exercise ball","stability ball","ball","band","machine","cable","weighted"]},
}


# Broader prep/stretch pool. These are additional to the named fallbacks above.
# The app chooses only movements whose tags match the exercises in the current
# workout, so upper-body days cannot accidentally pull in lower-body stretches.
PREP_META = {
    "arm_circles":{"phase":"dynamic","tags":["shoulders"],"dose":"10 each way"},
    "shoulder_rolls":{"phase":"dynamic","tags":["shoulders"],"dose":"10 each way"},
    "chest_opener":{"phase":"dynamic","tags":["chest","shoulders"],"dose":"8–10 reps"},
    "thoracic_rotation":{"phase":"dynamic","tags":["back","lats","shoulders"],"dose":"6–8 each side"},
    "scapular_push":{"phase":"dynamic","tags":["chest","shoulders"],"dose":"8–10 reps"},
    "scapular_pull":{"phase":"dynamic","tags":["back","lats","shoulders"],"dose":"6–10 reps"},
    "leg_swings":{"phase":"dynamic","tags":["hamstrings","hips","quads"],"dose":"8–10 each leg"},
    "walking_lunge":{"phase":"dynamic","tags":["quads","glutes","hips"],"dose":"6 each side"},
    "bodyweight_squat":{"phase":"dynamic","tags":["quads","glutes","hips"],"dose":"8–10 reps"},
    "hip_circles":{"phase":"dynamic","tags":["hips","glutes"],"dose":"8 each way"},
    "knee_hugs":{"phase":"dynamic","tags":["hips","glutes","hamstrings"],"dose":"6 each side"},
    "high_knees":{"phase":"dynamic","tags":["hips","quads","calves"],"dose":"20–30 sec"},
    "ankle_circles":{"phase":"dynamic","tags":["calves","ankles"],"dose":"8 each way"},
    "chest_stretch":{"phase":"static","tags":["chest","shoulders"],"dose":"30 sec each side"},
    "shoulder_stretch":{"phase":"static","tags":["shoulders","rear_shoulders"],"dose":"30 sec each side"},
    "triceps_stretch":{"phase":"static","tags":["triceps","shoulders"],"dose":"30 sec each side"},
    "lat_stretch":{"phase":"static","tags":["back","lats"],"dose":"30 sec each side"},
    "hamstring_stretch":{"phase":"static","tags":["hamstrings"],"dose":"30 sec each side"},
    "quad_stretch":{"phase":"static","tags":["quads"],"dose":"30 sec each side"},
    "calf_stretch":{"phase":"static","tags":["calves","ankles"],"dose":"30 sec each side"},
    "glute_stretch":{"phase":"static","tags":["glutes","hips"],"dose":"30 sec each side"},
    "hip_flexor_stretch":{"phase":"static","tags":["hips","quads"],"dose":"30 sec each side"},
}

PREP_POOL_SPECS = [
    # Dynamic upper body
    {"label":"dynamic chest / shoulders","phase":"dynamic","tags":["chest","shoulders"],"dose":"8–10 controlled reps","quota":4,
     "patterns":[["dynamic","chest","stretch"],["chest","opener"],["arm","swing"],["scapula","push"],["scapular","push"]],
     "exclude":["machine","cable","dumbbell","barbell","band","roller","lying","weighted"]},
    {"label":"dynamic shoulders","phase":"dynamic","tags":["shoulders","rear_shoulders"],"dose":"8–10 each way","quota":4,
     "patterns":[["arm","circle"],["shoulder","circle"],["shoulder","roll"],["wall","slide"],["shoulder","mobility"]],
     "exclude":["machine","cable","dumbbell","barbell","band","roller","internal","external","weighted"]},
    {"label":"dynamic upper back","phase":"dynamic","tags":["back","lats","shoulders"],"dose":"6–8 each side","quota":4,
     "patterns":[["thoracic","rotation"],["torso","rotation"],["upper","back","rotation"],["thread","needle"],["reach","sky"],["scapula","pull"],["scapular","pull"]],
     "exclude":["machine","cable","dumbbell","barbell","band","weighted"]},
    # Dynamic lower body
    {"label":"dynamic hips / legs","phase":"dynamic","tags":["hips","hamstrings","quads"],"dose":"8–10 each side","quota":5,
     "patterns":[["leg","swing"],["straight","leg","kick"],["walking","high","kick"],["hip","opener"],["hip","circle"],["knee","hug"],["leg","cradle"]],
     "exclude":["machine","cable","dumbbell","barbell","band","lying","weighted","wall"]},
    {"label":"dynamic squat / lunge","phase":"dynamic","tags":["quads","glutes","hips"],"dose":"6–10 reps","quota":5,
     "patterns":[["walking","lunge"],["forward","lunge"],["reverse","lunge"],["bodyweight","squat"],["body","weight","squat"],["air","squat"]],
     "exclude":["jump","drop","plyometric","pistol","sissy","curtsey","curtsy","cossack","barbell","dumbbell","smith","hack","row","weighted"]},
    {"label":"dynamic ankles / calves","phase":"dynamic","tags":["calves","ankles"],"dose":"8–10 each side","quota":3,
     "patterns":[["ankle","circle"],["ankle","rotation"],["ankle","mobility"]],
     "exclude":["machine","cable","dumbbell","barbell","band","weighted"]},
    # Static upper body
    {"label":"chest stretch","phase":"static","tags":["chest","shoulders"],"dose":"30 sec each side","quota":4,
     "patterns":[["chest","stretch"],["pectoralis","stretch"],["front","shoulder","stretch"]],
     "exclude":["ball","band","machine","cable","weighted","dynamic"]},
    {"label":"shoulder stretch","phase":"static","tags":["shoulders","rear_shoulders"],"dose":"30 sec each side","quota":4,
     "patterns":[["rear","deltoid","stretch"],["posterior","shoulder","stretch"],["cross","body","shoulder"],["shoulder","stretch"]],
     "exclude":["ball","band","machine","cable","roller","weighted","dynamic"]},
    {"label":"triceps stretch","phase":"static","tags":["triceps","shoulders"],"dose":"30 sec each side","quota":3,
     "patterns":[["triceps","stretch"],["tricep","stretch"]],
     "exclude":["ball","band","machine","cable","weighted","dynamic"]},
    {"label":"lat / back stretch","phase":"static","tags":["back","lats"],"dose":"30 sec each side","quota":4,
     "patterns":[["lat","stretch"],["lats","stretch"],["back","stretch"]],
     "exclude":["lower back","ball","band","machine","cable","weighted","dynamic"]},
    {"label":"biceps / forearm stretch","phase":"static","tags":["biceps"],"dose":"30 sec each side","quota":3,
     "patterns":[["biceps","stretch"],["bicep","stretch"],["forearm","stretch"]],
     "exclude":["ball","band","machine","cable","weighted","dynamic"]},
    # Static lower body
    {"label":"hamstring stretch","phase":"static","tags":["hamstrings"],"dose":"30 sec each side","quota":5,
     "patterns":[["hamstring","stretch"],["hamstrings","stretch"]],
     "exclude":["ball","band","machine","cable","weighted","dynamic"]},
    {"label":"quad stretch","phase":"static","tags":["quads"],"dose":"30 sec each side","quota":4,
     "patterns":[["quadriceps","stretch"],["quad","stretch"]],
     "exclude":["all fours","squad","ball","band","machine","cable","weighted","dynamic"]},
    {"label":"calf stretch","phase":"static","tags":["calves","ankles"],"dose":"30 sec each side","quota":4,
     "patterns":[["calf","stretch"],["calves","stretch"],["achilles","stretch"]],
     "exclude":["ball","band","machine","cable","weighted","dynamic"]},
    {"label":"glute stretch","phase":"static","tags":["glutes","hips"],"dose":"30 sec each side","quota":4,
     "patterns":[["glute","stretch"],["gluteus","stretch"],["figure","four","stretch"]],
     "exclude":["ball","band","machine","cable","weighted","dynamic"]},
    {"label":"hip flexor stretch","phase":"static","tags":["hips","quads"],"dose":"30 sec each side","quota":4,
     "patterns":[["hip","flexor","stretch"],["hip","flexor"]],
     "exclude":["exercise ball","stability ball","ball","band","machine","cable","weighted","dynamic"]},
    {"label":"adductor / groin stretch","phase":"static","tags":["hips","adductors"],"dose":"30 sec each side","quota":3,
     "patterns":[["adductor","stretch"],["groin","stretch"],["inner","thigh","stretch"]],
     "exclude":["ball","band","machine","cable","weighted","dynamic"]},
]

def norm(v:str)->str:
    v=(v or '').lower().replace('&',' and ')
    v=re.sub(r'[^a-z0-9]+',' ',v)
    return re.sub(r'\s+',' ',v).strip()

def contains_all(text,parts): return all(norm(x) in text for x in parts)

def matches(rec,spec):
    name=norm(rec.get('name','')); equipment=norm(rec.get('equipment','')); category=norm(rec.get('category',''))
    metadata=norm(' '.join(str(rec.get(k,'')) for k in ('name','category','target','muscle_group'))+' '+' '.join(str(x) for x in (rec.get('secondary_muscles') or [])))
    if equipment not in ALLOWED_EQUIPMENT:return False
    cats={norm(x) for x in spec.get('category_any',[])}
    if cats and category not in cats:return False
    meta_terms=[norm(x) for x in spec.get('meta_any',[])]
    if meta_terms and not any(x and x in metadata for x in meta_terms):return False
    if any(norm(x) in name for x in GLOBAL_EXCLUDE):return False
    if any(norm(x) in name for x in spec.get('exclude',[])):return False
    if spec.get('all') and not contains_all(name,spec['all']):return False
    groups=spec.get('any',[])
    if groups and not any(contains_all(name,g) for g in groups):return False
    return True

def score(rec,spec):
    if not matches(rec,spec):return -10000
    name=norm(rec.get('name','')); equipment=norm(rec.get('equipment','')); category=norm(rec.get('category',''))
    s=100.0
    for i,p in enumerate(spec.get('prefer',[])):
        if equipment==norm(p): s+=55-i*5; break
    for w in spec.get('boost',[]):
        if norm(w) in name:s+=8
    s-=max(0,len(name.split())-6)*2.5
    if category in {'chest','back','shoulders','upper arms','upper legs','lower legs'}:s+=2
    return s

def load_full_data(source:Path):
    for path in [source/'data'/'exercises.json', source/'exercises.json']:
        if path.exists():
            try:
                data=json.loads(path.read_text(encoding='utf-8'))
                if isinstance(data,list):return data
            except Exception:pass
    return []

def instruction_map(source:Path):
    out={}
    for rec in load_full_data(source):
        rid=str(rec.get('id','')).zfill(4); ins=rec.get('instructions')
        if isinstance(ins,dict):ins=ins.get('en')
        if isinstance(ins,list):ins=' '.join(str(x) for x in ins)
        if isinstance(ins,str) and ins.strip():out[rid]=ins.strip()
    return out

def media_item(rec,filename,source,instructions,role=None,key=None):
    gif_rel=Path(rec.get('gif_url') or f'videos/{filename}')
    img_rel=Path(rec.get('image') or f'images/{Path(filename).with_suffix(".jpg").name}')
    gif_src=source/'public'/gif_rel; img_src=source/'public'/img_rel
    if not gif_src.exists() or not img_src.exists():return None
    rid=str(rec.get('id','')).zfill(4)
    item={"id":rid,"filename":filename,"name":rec.get('name') or filename,"category":rec.get('category',''),"equipment":rec.get('equipment',''),"target":rec.get('target',''),"muscle_group":rec.get('muscle_group',''),"secondary_muscles":rec.get('secondary_muscles') or [],"image":f'images/{img_src.name}',"gif_url":f'videos/{gif_src.name}'}
    if role:item['role']=role
    if key:item['key']=key
    if rid in instructions:item['instructions']=instructions[rid]
    return item,gif_src,img_src

def find_prep(lookup,key,spec,used):
    patterns=spec.get('patterns',[])
    excludes=[norm(x) for x in spec.get('exclude',[])]
    req_equipment={norm(x) for x in spec.get('require_equipment',[])}
    ranked=[]
    for filename,rec in lookup.items():
        if filename in used:continue
        name=norm(rec.get('name','')); equipment=norm(rec.get('equipment',''))
        if any(x and x in name for x in excludes):continue
        if req_equipment and equipment not in req_equipment:continue
        for rank,g in enumerate(patterns):
            if not contains_all(name,g):continue
            # Strongly favour the earliest, most-specific pattern, simple
            # body-weight movements, and concise names. Exact/near-exact names
            # beat incidental word matches.
            sc=260-rank*35-max(0,len(name.split())-5)*4
            if equipment=='body weight':sc+=35
            if equipment in {'other',''}:sc+=8
            gnorm=' '.join(norm(x) for x in g)
            if name==gnorm:sc+=55
            elif name.startswith(gnorm) or name.endswith(gnorm):sc+=22
            if any(x in name for x in ['stretch','circle','swing','lunge','squat','rotation','roll','knee','scapular','scapula']):sc+=8
            ranked.append((sc,filename,rec));break
    ranked.sort(reverse=True,key=lambda x:x[0])
    return ranked[0][1:] if ranked else (None,None)

def prep_candidates(lookup,spec,limit=5):
    patterns=spec.get('patterns',[]); excludes=[norm(x) for x in spec.get('exclude',[])]
    out=[]
    for filename,rec in lookup.items():
        name=norm(rec.get('name',''))
        if any(x and x in name for x in excludes):continue
        for g in patterns:
            if contains_all(name,g):
                out.append((filename,rec.get('name',''),rec.get('equipment','')));break
        if len(out)>=limit:break
    return out


def prep_pool_candidates(lookup,spec,used):
    patterns=spec.get('patterns',[])
    excludes=[norm(x) for x in spec.get('exclude',[])]
    allowed={"body weight","other",""}
    ranked=[]
    for filename,rec in lookup.items():
        if filename in used: continue
        name=norm(rec.get('name','')); equipment=norm(rec.get('equipment',''))
        if equipment not in allowed: continue
        if any(x and x in name for x in excludes): continue
        best=None
        for rank,g in enumerate(patterns):
            if not contains_all(name,g): continue
            sc=240-rank*22-max(0,len(name.split())-6)*4
            if equipment=='body weight': sc+=28
            if 'stretch' in name: sc+=12 if spec.get('phase')=='static' else 0
            if spec.get('phase')=='dynamic' and any(x in name for x in ['dynamic','circle','rotation','swing','lunge','squat','mobility','scapula','scapular']): sc+=12
            gnorm=' '.join(norm(x) for x in g)
            if name==gnorm: sc+=45
            elif name.startswith(gnorm) or name.endswith(gnorm): sc+=18
            best=sc; break
        if best is not None: ranked.append((best,filename,rec))
    ranked.sort(reverse=True,key=lambda x:(x[0],x[1]))
    return ranked

def main():
    ap=argparse.ArgumentParser(description='Build Gym Tracker v13.0 exercise + dynamic prep/stretch media libraries from your local exercise GIF collection.')
    ap.add_argument('--source',default='~/gym-exercise-lookup')
    ap.add_argument('--dest',default='.')
    ap.add_argument('--count',type=int,default=TARGET_COUNT)
    ap.add_argument('--dry-run',action='store_true')
    args=ap.parse_args()
    print('Gym Tracker media builder v13.0')
    source=Path(args.source).expanduser().resolve(); dest=Path(args.dest).expanduser().resolve()
    lookup_path=source/'exercise-gif-lookup.json'
    if not lookup_path.exists():print(f'ERROR: cannot find {lookup_path}',file=sys.stderr);return 1
    lookup=json.loads(lookup_path.read_text(encoding='utf-8'))
    if not isinstance(lookup,dict) or not lookup:print('ERROR: invalid lookup',file=sys.stderr);return 1
    instructions=instruction_map(source)

    used=set(); selected=[]; role_counts={r:0 for r in ROLE_SPECS}
    for role,spec in ROLE_SPECS.items():
        ranked=sorted(((score(rec,spec),fn,rec) for fn,rec in lookup.items()),reverse=True,key=lambda x:x[0])
        for sc,fn,rec in ranked:
            if role_counts[role]>=spec['quota'] or len(selected)>=args.count:break
            if sc<80 or fn in used:continue
            selected.append((role,fn,rec,sc));role_counts[role]+=1;used.add(fn)
    if len(selected)<args.count:
        extras=[]
        for role,spec in ROLE_SPECS.items():
            for fn,rec in lookup.items():
                if fn in used:continue
                sc=score(rec,spec)
                if sc>=90:extras.append((sc,role,fn,rec))
        extras.sort(reverse=True,key=lambda x:x[0])
        for sc,role,fn,rec in extras:
            if len(selected)>=args.count:break
            if fn in used:continue
            selected.append((role,fn,rec,sc));role_counts[role]+=1;used.add(fn)
    under=[]
    for role,min_count in ROLE_RECOMMENDED_MIN.items():
        actual=role_counts.get(role,0)
        if actual<min_count:under.append((role,actual,min_count))
    if under:
        print('WARNING: some movement categories have limited variety in this dataset:',file=sys.stderr)
        for role,actual,min_count in under:print(f'  {role}: {actual} found; {min_count}+ recommended',file=sys.stderr)
        print('The app will still work and can use nearby compatible roles where configured.',file=sys.stderr)
    if len(selected)<args.count:print(f'WARNING: requested {args.count} exercises but found {len(selected)} after strict filtering.',file=sys.stderr)
    if len(selected)<90:print(f'ERROR: only found {len(selected)} suitable exercises',file=sys.stderr);return 2

    mainlib=[];main_media=[];report=[]
    for role,fn,rec,sc in selected[:args.count]:
        m=media_item(rec,fn,source,instructions,role=role)
        if not m:print(f'ERROR: missing media for {fn}',file=sys.stderr);return 3
        item,gif_src,img_src=m;mainlib.append(item);main_media.append((item,gif_src,img_src));report.append(f'{role:18} | {fn:24} | {item["name"]} | {item["equipment"]}')

    # Prep / stretch GIFs are intentionally additional to the 106 main exercises.
    prep=[];prep_media=[];prep_report=[];prep_used=set()
    for key,spec in PREP_SPECS.items():
        fn,rec=find_prep(lookup,key,spec,prep_used)
        if not fn:
            cand=prep_candidates(lookup,spec)
            suffix=(' | candidates: '+', '.join(f'{f}={n}' for f,n,e in cand)) if cand else ''
            prep_report.append(f'{key:22} | NOT FOUND{suffix}');continue
        m=media_item(rec,fn,source,instructions,key=key)
        if not m:prep_report.append(f'{key:22} | MEDIA MISSING | {fn}');continue
        item,gif_src,img_src=m
        meta=PREP_META.get(key,{})
        item.update({"phase":meta.get("phase","dynamic"),"tags":meta.get("tags",[]),"dose":meta.get("dose","")})
        prep.append(item);prep_media.append((item,gif_src,img_src));prep_used.add(fn)
        prep_report.append(f'{key:22} | {fn:24} | {item["name"]} | {item["phase"]} | {",".join(item["tags"])}')

    # Add a broader, strictly filtered pool so the app can rotate prep and
    # stretches week to week while still matching the muscles trained that day.
    for spec in PREP_POOL_SPECS:
        added=0
        for sc,fn,rec in prep_pool_candidates(lookup,spec,prep_used):
            if added>=spec.get("quota",3): break
            key=f'pool_{spec["phase"]}_{Path(fn).stem}'
            m=media_item(rec,fn,source,instructions,key=key)
            if not m: continue
            item,gif_src,img_src=m
            item.update({"phase":spec["phase"],"tags":spec["tags"],"dose":spec["dose"],"pool_label":spec["label"]})
            prep.append(item);prep_media.append((item,gif_src,img_src));prep_used.add(fn);added+=1
            prep_report.append(f'{key:22} | {fn:24} | {item["name"]} | {item["phase"]} | {",".join(item["tags"])}')

    print(f'Selected {len(mainlib)} main exercises and {len(prep)} prep/stretch movements.\n')
    for role in ROLE_SPECS:print(f'  {role:18}: {sum(1 for x in mainlib if x["role"]==role)}')
    print('\nPrep/stretch matches:')
    print('\n'.join('  '+x for x in prep_report))
    if args.dry_run:return 0

    vd=dest/'videos';im=dest/'images'
    # Do not prune generated media here. Older workouts stored in the iPhone/PWA
    # can still reference media from an earlier curated library. Keeping those
    # files is cheap and prevents an app update from breaking an in-progress or
    # historical workout. A future explicit prune command can remove unused
    # files after the user has exported/cleared old data.
    vd.mkdir(parents=True,exist_ok=True);im.mkdir(parents=True,exist_ok=True)
    # Deduplicate files that happen to be used both in main and prep libraries.
    copied=set()
    for item,gif_src,img_src in main_media+prep_media:
        for srcp,rel in [(gif_src,item['gif_url']),(img_src,item['image'])]:
            if rel in copied:continue
            shutil.copy2(srcp,dest/rel);copied.add(rel)
    # Validate the exact paths that will be written to the JSON libraries before
    # publishing them. This makes a missing GIF/JPG a build failure instead of
    # a broken card appearing later on the phone.
    missing=[]
    for item in mainlib+prep:
        for field in ('gif_url','image'):
            rel=item.get(field)
            if rel and not (dest/rel).is_file():missing.append(f'{item.get("name",item.get("filename","?"))}: {rel}')
    if missing:
        print('ERROR: generated library references missing media:',file=sys.stderr)
        for line in missing:print(f'  {line}',file=sys.stderr)
        return 4
    (dest/'exercise-library.json').write_text(json.dumps(mainlib,ensure_ascii=False,indent=2),encoding='utf-8')
    (dest/'prep-library.json').write_text(json.dumps(prep,ensure_ascii=False,indent=2),encoding='utf-8')
    (dest/'exercise-library-selection.txt').write_text('\n'.join(report)+'\n',encoding='utf-8')
    (dest/'prep-library-selection.txt').write_text('\n'.join(prep_report)+'\n',encoding='utf-8')
    print(f'\nWrote {len(mainlib)} main exercises and {len(prep)} prep/stretch movements to {dest}.')
    return 0

if __name__=='__main__':raise SystemExit(main())
