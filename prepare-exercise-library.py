#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re, shutil, sys
from pathlib import Path

TARGET_COUNT = 106

ROLE_SPECS = {
    "push_horizontal": {"quota":7,"any":[["chest","press"],["bench","press"]],"prefer":["leverage machine","smith machine","dumbbell","barbell","cable"],"boost":["seated","lever","machine","horizontal"],"exclude":["incline","decline","single arm","one arm","alternating","close grip","floor","ball"]},
    "push_incline": {"quota":6,"all":["incline","press"],"prefer":["leverage machine","smith machine","dumbbell","barbell"],"boost":["chest","bench"],"exclude":["single arm","one arm","alternating","ball"]},
    "push_fly": {"quota":5,"any":[["fly"],["crossover"],["pec","deck"]],"prefer":["leverage machine","cable","dumbbell"],"boost":["chest","seated","standing"],"exclude":["reverse","rear","single arm","one arm","ball"]},
    "push_vertical": {"quota":6,"any":[["shoulder","press"],["military","press"]],"prefer":["leverage machine","smith machine","dumbbell","barbell"],"boost":["seated","machine","lever"],"exclude":["single arm","one arm","alternating","behind neck","ball"]},
    "push_lateral": {"quota":5,"all":["lateral","raise"],"prefer":["leverage machine","cable","dumbbell"],"boost":["seated","lever","machine"],"exclude":["bent","rear","single arm","one arm","ball"]},
    "push_triceps": {"quota":7,"any":[["triceps","pushdown"],["triceps","extension"],["tricep","pushdown"],["tricep","extension"],["assisted","dip"]],"prefer":["cable","leverage machine","assisted","ez barbell","dumbbell"],"boost":["rope","bar","seated","lever"],"exclude":["single arm","one arm","kickback","bench dip","ball"]},
    "pull_vertical": {"quota":8,"any":[["pulldown"],["pull up"],["pullup"],["chin up"],["chinup"]],"prefer":["cable","leverage machine","assisted"],"boost":["lat","wide","neutral","close grip","assisted"],"exclude":["single arm","one arm","behind neck","straight arm","band"]},
    "pull_row": {"quota":11,"any":[["row"]],"prefer":["leverage machine","cable","smith machine","dumbbell","barbell"],"boost":["seated","chest supported","lever","machine"],"exclude":["upright row","single arm","one arm","renegade","inverted","ball"]},
    "pull_rear": {"quota":6,"any":[["reverse","fly"],["rear","delt"],["face","pull"]],"prefer":["leverage machine","cable","dumbbell"],"boost":["seated","machine","lever"],"exclude":["single arm","one arm","ball"]},
    "pull_biceps": {"quota":8,"any":[["curl"]],"prefer":["leverage machine","cable","ez barbell","dumbbell","barbell"],"boost":["preacher","biceps","seated","lever","machine","hammer"],"exclude":["wrist","reverse wrist","single arm","one arm","concentration","ball","zottman"]},
    "lower_compound": {"quota":8,"any":[["leg","press"],["hack","squat"],["smith","squat"],["belt","squat"],["squat"]],"prefer":["sled machine","leverage machine","smith machine","barbell"],"boost":["45","hack","smith","lever","machine"],"exclude":["single leg","one leg","pistol","sissy","jump","overhead","front squat","calf"]},
    "lower_quad": {"quota":5,"all":["leg","extension"],"prefer":["leverage machine","cable"],"boost":["lever","machine","seated"],"exclude":["single leg","one leg","band"]},
    "lower_ham_curl": {"quota":6,"all":["leg","curl"],"prefer":["leverage machine","cable"],"boost":["seated","lying","lever","machine"],"exclude":["single leg","one leg","ball","band"]},
    "lower_hinge": {"quota":5,"any":[["romanian","deadlift"],["stiff","leg","deadlift"],["stiff","legged","deadlift"],["back","extension"]],"prefer":["smith machine","barbell","dumbbell","leverage machine","weighted"],"boost":["smith","45","lever","machine"],"exclude":["single leg","one leg","kettlebell","band","ball"]},
    "lower_glute": {"quota":5,"any":[["hip","thrust"],["glute","bridge"],["glute","drive"]],"prefer":["leverage machine","smith machine","barbell","weighted"],"boost":["lever","machine","smith"],"exclude":["single leg","one leg","band","ball"]},
    "lower_hip": {"quota":4,"any":[["hip","abduction"],["hip","adduction"],["abductor"],["adductor"]],"prefer":["leverage machine","cable"],"boost":["seated","lever","machine"],"exclude":["single leg","one leg","band","lying"]},
    "lower_calf": {"quota":4,"all":["calf","raise"],"prefer":["leverage machine","sled machine","smith machine","dumbbell"],"boost":["standing","seated","lever","machine"],"exclude":["single leg","one leg","donkey","jump"]},
}

ALLOWED_EQUIPMENT={"leverage machine","cable","sled machine","smith machine","dumbbell","barbell","ez barbell","assisted","weighted","body weight","other"}
GLOBAL_EXCLUDE=["kettlebell","band","stability ball","bosu","medicine ball","resistance band","jump","burpee","handstand","muscle up","snatch","clean and jerk","olympic","pistol","sissy","dragon flag","wheel rollout","neck","wrist roller"]

# These are searched against the user's full 1,324-entry lookup. The first good
# match is used. If a particular movement is not present, v9 falls back to text.
PREP_SPECS = {
    "arm_circles": [["arm","circle"],["shoulder","circle"]],
    "shoulder_rolls": [["shoulder","roll"],["shoulder","circle"]],
    "chest_opener": [["dynamic","chest","stretch"],["chest","stretch"],["arm","swing"]],
    "thoracic_rotation": [["thoracic","rotation"],["upper","back","rotation"],["reach","to","sky"]],
    "scapular_push": [["scapular","push"],["scapula","push"]],
    "scapular_pull": [["scapular","pull"],["scapula","pull"]],
    "leg_swings": [["leg","swing"],["walking","high","kick"]],
    "walking_lunge": [["walking","lunge"],["forward","lunge"]],
    "bodyweight_squat": [["bodyweight","squat"],["body","weight","squat"],["air","squat"]],
    "hip_circles": [["hip","circle"],["hip","rotation"]],
    "knee_hugs": [["walking","knee","hug"],["knee","hug"]],
    "high_knees": [["high","knee"]],
    "ankle_circles": [["ankle","circle"],["ankle","rotation"]],
    "chest_stretch": [["chest","stretch"],["front","shoulder","stretch"]],
    "shoulder_stretch": [["shoulder","stretch"],["cross","body","shoulder"]],
    "triceps_stretch": [["triceps","stretch"],["overhead","triceps"]],
    "lat_stretch": [["lat","stretch"],["lats","stretch"],["side","lying","floor","stretch"]],
    "hamstring_stretch": [["hamstring","stretch"],["runner","stretch"]],
    "quad_stretch": [["quadriceps","stretch"],["quad","stretch"],["lying","prone","quadriceps"]],
    "calf_stretch": [["calf","stretch"],["posterior","tibialis","stretch"]],
    "glute_stretch": [["glute","stretch"],["lying","glute"]],
    "hip_flexor_stretch": [["hip","flexor","stretch"],["kneeling","hip","flexor"]],
}

def norm(v:str)->str:
    v=(v or '').lower().replace('&',' and ')
    v=re.sub(r'[^a-z0-9]+',' ',v)
    return re.sub(r'\s+',' ',v).strip()

def contains_all(text,parts): return all(norm(x) in text for x in parts)

def matches(rec,spec):
    name=norm(rec.get('name','')); equipment=norm(rec.get('equipment',''))
    if equipment not in ALLOWED_EQUIPMENT:return False
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

def find_prep(lookup,key,groups,used):
    ranked=[]
    for filename,rec in lookup.items():
        if filename in used:continue
        name=norm(rec.get('name',''))
        for rank,g in enumerate(groups):
            if contains_all(name,g):
                equipment=norm(rec.get('equipment',''))
                # Prefer body-weight / simple prep movements and concise names.
                sc=200-rank*25-max(0,len(name.split())-5)*3
                if equipment=='body weight':sc+=30
                if any(x in name for x in ['stretch','circle','swing','lunge','squat','rotation','roll','knee']):sc+=8
                ranked.append((sc,filename,rec));break
    ranked.sort(reverse=True,key=lambda x:x[0])
    return ranked[0][1:] if ranked else (None,None)

def main():
    ap=argparse.ArgumentParser(description='Build Gym Tracker v9 exercise + prep media libraries from your local exercise GIF collection.')
    ap.add_argument('--source',default='~/gym-exercise-lookup')
    ap.add_argument('--dest',default='.')
    ap.add_argument('--count',type=int,default=TARGET_COUNT)
    ap.add_argument('--dry-run',action='store_true')
    args=ap.parse_args()
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
    if len(selected)<90:print(f'ERROR: only found {len(selected)} suitable exercises',file=sys.stderr);return 2

    mainlib=[];main_media=[];report=[]
    for role,fn,rec,sc in selected[:args.count]:
        m=media_item(rec,fn,source,instructions,role=role)
        if not m:print(f'ERROR: missing media for {fn}',file=sys.stderr);return 3
        item,gif_src,img_src=m;mainlib.append(item);main_media.append((item,gif_src,img_src));report.append(f'{role:18} | {fn:24} | {item["name"]} | {item["equipment"]}')

    # Prep / stretch GIFs are intentionally additional to the 106 main exercises.
    prep=[];prep_media=[];prep_report=[];prep_used=set()
    for key,groups in PREP_SPECS.items():
        fn,rec=find_prep(lookup,key,groups,prep_used)
        if not fn:prep_report.append(f'{key:22} | NOT FOUND');continue
        m=media_item(rec,fn,source,instructions,key=key)
        if not m:prep_report.append(f'{key:22} | MEDIA MISSING | {fn}');continue
        item,gif_src,img_src=m;prep.append(item);prep_media.append((item,gif_src,img_src));prep_used.add(fn);prep_report.append(f'{key:22} | {fn:24} | {item["name"]}')

    print(f'Selected {len(mainlib)} main exercises and {len(prep)} prep/stretch movements.\n')
    for role in ROLE_SPECS:print(f'  {role:18}: {sum(1 for x in mainlib if x["role"]==role)}')
    print('\nPrep/stretch matches:')
    print('\n'.join('  '+x for x in prep_report))
    if args.dry_run:return 0

    vd=dest/'videos';im=dest/'images'
    if vd.exists():shutil.rmtree(vd)
    if im.exists():shutil.rmtree(im)
    vd.mkdir(parents=True);im.mkdir(parents=True)
    # Deduplicate files that happen to be used both in main and prep libraries.
    copied=set()
    for item,gif_src,img_src in main_media+prep_media:
        for srcp,rel in [(gif_src,item['gif_url']),(img_src,item['image'])]:
            if rel in copied:continue
            shutil.copy2(srcp,dest/rel);copied.add(rel)
    (dest/'exercise-library.json').write_text(json.dumps(mainlib,ensure_ascii=False,indent=2),encoding='utf-8')
    (dest/'prep-library.json').write_text(json.dumps(prep,ensure_ascii=False,indent=2),encoding='utf-8')
    (dest/'exercise-library-selection.txt').write_text('\n'.join(report)+'\n',encoding='utf-8')
    (dest/'prep-library-selection.txt').write_text('\n'.join(prep_report)+'\n',encoding='utf-8')
    print(f'\nWrote {len(mainlib)} main exercises and {len(prep)} prep/stretch movements to {dest}.')
    return 0

if __name__=='__main__':raise SystemExit(main())
