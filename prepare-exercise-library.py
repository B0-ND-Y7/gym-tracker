#!/usr/bin/env python3
"""Build the v16.1 curated exercise library from the user's local 1,324-exercise dataset.

This intentionally favours conventional commercial-gym movements: machines, Smith,
cable, dumbbell and barbell work. It does not generate prep/stretch content.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

TARGET_COUNT = 360

ROLE_SPECS = {
    "push_horizontal": {
        "quota": 26, "category_any": ["chest"],
        "any": [["chest", "press"], ["bench", "press"]],
        "prefer": ["leverage machine", "smith machine", "dumbbell", "barbell", "cable"],
        "boost": ["machine", "lever", "seated", "smith", "chest"],
        "exclude": ["incline", "decline", "reverse grip", "guillotine", "floor", "close grip"],
    },
    "push_incline": {
        "quota": 20, "category_any": ["chest"], "all": ["incline", "press"],
        "prefer": ["leverage machine", "smith machine", "dumbbell", "barbell"],
        "boost": ["machine", "lever", "smith", "chest"],
        "exclude": ["reverse grip"],
    },
    "push_decline": {
        "quota": 8, "category_any": ["chest"], "all": ["decline", "press"],
        "prefer": ["leverage machine", "smith machine", "dumbbell", "barbell"],
        "boost": ["machine", "lever", "smith", "chest"],
        "exclude": ["reverse grip"],
    },
    "push_fly": {
        "quota": 18, "category_any": ["chest"],
        "any": [["fly"], ["crossover"], ["pec", "deck"]],
        "prefer": ["leverage machine", "cable", "dumbbell"],
        "boost": ["machine", "lever", "seated", "standing", "pec deck", "chest"],
        "exclude": ["reverse", "rear delt", "incline dumbbell", "decline dumbbell"],
    },
    "push_vertical": {
        "quota": 22, "category_any": ["shoulders"],
        "any": [["shoulder", "press"], ["military", "press"]],
        "prefer": ["leverage machine", "smith machine", "dumbbell", "barbell"],
        "boost": ["machine", "lever", "seated", "smith"],
        "exclude": ["behind neck", "behind head", "reverse grip"],
    },
    "push_lateral": {
        "quota": 16, "category_any": ["shoulders"],
        "any": [["lateral", "raise"], ["side", "lateral"]],
        "prefer": ["leverage machine", "cable", "dumbbell"],
        "boost": ["machine", "lever", "seated", "standing"],
        "exclude": ["bent over", "rear delt"],
    },
    "push_triceps": {
        "quota": 28, "category_any": ["upper arms"], "meta_any": ["triceps", "tricep"],
        "any": [["pushdown"], ["triceps", "extension"], ["tricep", "extension"], ["dip"]],
        "prefer": ["cable", "leverage machine", "assisted", "ez barbell", "dumbbell", "smith machine"],
        "boost": ["rope", "bar", "machine", "lever", "seated", "standing", "overhead"],
        "exclude": ["bench dip", "kickback", "lying", "skullcrusher", "skull crusher"],
    },
    "pull_vertical": {
        "quota": 28, "category_any": ["back"],
        "any": [["pulldown"], ["pull up"], ["pull-up"], ["chin up"], ["chin-up"]],
        "prefer": ["cable", "leverage machine", "assisted"],
        "boost": ["lat", "front", "machine", "lever", "assisted", "neutral grip", "close grip", "wide grip"],
        "exclude": ["behind neck", "behind head"],
    },
    "pull_row": {
        "quota": 42, "category_any": ["back"], "any": [["row"]],
        "prefer": ["leverage machine", "cable", "smith machine", "dumbbell", "barbell"],
        "boost": ["machine", "lever", "seated", "chest supported", "high row", "t bar", "smith"],
        "exclude": ["upright row", "renegade", "kayak", "twist row"],
    },
    "pull_rear": {
        "quota": 20, "category_any": ["shoulders", "back"],
        "any": [["reverse", "fly"], ["rear", "delt"], ["face", "pull"]],
        "prefer": ["leverage machine", "cable", "dumbbell"],
        "boost": ["machine", "lever", "seated", "standing", "pec deck"],
        "exclude": ["lying"],
    },
    "pull_biceps": {
        "quota": 38, "category_any": ["upper arms"], "meta_any": ["biceps", "bicep", "brachialis"],
        "any": [["curl"]],
        "prefer": ["leverage machine", "cable", "ez barbell", "dumbbell", "barbell"],
        "boost": ["biceps curl", "bicep curl", "preacher", "hammer", "machine", "lever", "standing", "seated"],
        "exclude": ["wrist", "leg curl", "arm blaster", "concentration", "zottman", "spider curl", "drag curl", "reverse curl"],
    },
    "lower_compound": {
        "quota": 30, "category_any": ["upper legs"],
        "any": [["leg", "press"], ["hack", "squat"], ["smith", "squat"], ["squat"]],
        "prefer": ["sled machine", "leverage machine", "smith machine", "barbell", "dumbbell"],
        "boost": ["45", "hack", "machine", "lever", "smith", "full squat", "goblet"],
        "exclude": ["front squat", "overhead", "zercher", "split squat", "jump squat", "calf"],
    },
    "lower_quad": {
        "quota": 10, "category_any": ["upper legs"], "meta_any": ["quadriceps", "quads"],
        "any": [["leg", "extension"], ["quad", "extension"]],
        "prefer": ["leverage machine", "cable"],
        "boost": ["machine", "lever", "seated"],
    },
    "lower_ham_curl": {
        "quota": 14, "category_any": ["upper legs"], "meta_any": ["hamstrings", "hamstring"],
        "all": ["leg", "curl"],
        "prefer": ["leverage machine", "cable"],
        "boost": ["machine", "lever", "seated", "lying"],
    },
    "lower_hinge": {
        "quota": 12, "category_any": ["upper legs", "back"],
        "any": [["romanian", "deadlift"], ["stiff", "leg", "deadlift"], ["stiff", "legged", "deadlift"], ["back", "extension"]],
        "prefer": ["smith machine", "barbell", "dumbbell", "leverage machine", "weighted"],
        "boost": ["romanian", "smith", "machine", "lever", "45"],
        "exclude": ["good morning"],
    },
    "lower_glute": {
        "quota": 12, "category_any": ["upper legs"], "meta_any": ["glute", "glutes", "gluteus"],
        "any": [["hip", "thrust"], ["glute", "drive"], ["glute", "kickback"], ["hip", "extension"]],
        "prefer": ["leverage machine", "smith machine", "barbell", "cable", "weighted"],
        "boost": ["machine", "lever", "smith", "hip thrust", "glute drive"],
        "exclude": ["bridge march", "floor"],
    },
    "lower_hip": {
        "quota": 8, "category_any": ["upper legs"],
        "any": [["hip", "abduction"], ["hip", "adduction"], ["abductor"], ["adductor"]],
        "prefer": ["leverage machine", "cable"],
        "boost": ["machine", "lever", "seated"],
        "exclude": ["lying"],
    },
    "lower_calf": {
        "quota": 8, "category_any": ["lower legs"], "meta_any": ["calves", "calf", "gastrocnemius", "soleus"],
        "any": [["calf", "raise"], ["calf", "press"]],
        "prefer": ["leverage machine", "sled machine", "smith machine", "dumbbell", "barbell"],
        "boost": ["machine", "lever", "standing", "seated", "smith", "leg press"],
        "exclude": ["donkey", "jump"],
    },
}

# Avoid novelty, athletic drills and fiddly unilateral variations in the default chooser.
GLOBAL_EXCLUDE = [
    "kettlebell", "band", "stability ball", "bosu", "medicine ball", "resistance band",
    "burpee", "handstand", "muscle up", "snatch", "clean and jerk", "olympic", "turkish",
    "pistol", "sissy", "cossack", "curtsy", "curtsey", "jefferson", "renegade",
    "single leg", "one leg", "single arm", "one arm", "alternating", "alternate",
    "behind neck", "behind head", "guillotine", "arm blaster", "kayak", "side plank",
    "inverse leg curl", "biceps curl squat", "standing twist row", "good morning", "neck",
]
ALLOWED_EQUIPMENT = {
    "leverage machine", "cable", "sled machine", "smith machine", "dumbbell", "barbell",
    "ez barbell", "assisted", "weighted", "body weight", "other"
}


def norm(value: object) -> str:
    text = str(value or "").lower().replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def contains_all(text: str, parts: list[str]) -> bool:
    return all(norm(part) in text for part in parts)


def metadata_text(rec: dict) -> str:
    secondary = rec.get("secondary_muscles") or []
    if not isinstance(secondary, list):
        secondary = [secondary]
    return norm(" ".join(str(rec.get(k, "")) for k in ("name", "category", "target", "muscle_group")) + " " + " ".join(map(str, secondary)))


def disallowed_setup(rec: dict) -> bool:
    name = norm(rec.get("name", ""))
    equipment = norm(rec.get("equipment", ""))
    if any(term in name for term in GLOBAL_EXCLUDE):
        return True
    # Standing/seated cable work is useful. Cable movements requiring the floor/bench are not.
    if equipment == "cable" and any(term in name for term in ("lying", "supine", "on floor", "floor", "bench press", "incline fly", "decline fly", "kneeling")):
        return True
    return False


def matches(rec: dict, spec: dict) -> bool:
    name = norm(rec.get("name", ""))
    equipment = norm(rec.get("equipment", ""))
    category = norm(rec.get("category", ""))
    meta = metadata_text(rec)
    if equipment not in ALLOWED_EQUIPMENT or disallowed_setup(rec):
        return False
    cats = {norm(x) for x in spec.get("category_any", [])}
    if cats and category not in cats:
        return False
    meta_terms = [norm(x) for x in spec.get("meta_any", [])]
    if meta_terms and not any(x and x in meta for x in meta_terms):
        return False
    if any(norm(x) in name for x in spec.get("exclude", [])):
        return False
    if spec.get("all") and not contains_all(name, spec["all"]):
        return False
    groups = spec.get("any", [])
    if groups and not any(contains_all(name, group) for group in groups):
        return False
    return True


def score(rec: dict, spec: dict) -> float:
    if not matches(rec, spec):
        return -10000
    name = norm(rec.get("name", ""))
    equipment = norm(rec.get("equipment", ""))
    score_value = 100.0
    for index, preferred in enumerate(spec.get("prefer", [])):
        if equipment == norm(preferred):
            score_value += 68 - index * 7
            break
    for boost in spec.get("boost", []):
        if norm(boost) in name:
            score_value += 9
    # Short, ordinary names usually represent the straightforward movement the user wants.
    score_value -= max(0, len(name.split()) - 6) * 3
    if " v 2" in name or " variation" in name:
        score_value -= 8
    if "pov" in name:
        score_value -= 4
    return score_value


def load_lookup(source: Path) -> dict:
    path = source / "exercise-gif-lookup.json"
    if not path.is_file():
        raise FileNotFoundError(f"cannot find {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or not payload:
        raise ValueError("exercise-gif-lookup.json is empty or invalid")
    return payload


def load_full_data(source: Path) -> list[dict]:
    for path in (source / "data" / "exercises.json", source / "exercises.json"):
        if path.is_file():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    return data
            except Exception:
                pass
    return []


def instruction_map(source: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for rec in load_full_data(source):
        rid = str(rec.get("id", "")).zfill(4)
        ins = rec.get("instructions")
        if isinstance(ins, dict):
            ins = ins.get("en")
        if isinstance(ins, list):
            ins = "\n".join(str(item) for item in ins if str(item).strip())
        if isinstance(ins, str) and ins.strip():
            result[rid] = ins.strip()
    return result


def media_item(rec: dict, filename: str, source: Path, instructions: dict[str, str], role: str):
    gif_rel = Path(rec.get("gif_url") or f"videos/{filename}")
    img_rel = Path(rec.get("image") or f"images/{Path(filename).with_suffix('.jpg').name}")
    gif_src = source / "public" / gif_rel
    img_src = source / "public" / img_rel
    if not gif_src.is_file() or not img_src.is_file():
        return None
    rid = str(rec.get("id", "")).zfill(4)
    item = {
        "id": rid,
        "filename": filename,
        "name": rec.get("name") or filename,
        "role": role,
        "category": rec.get("category", ""),
        "equipment": rec.get("equipment", ""),
        "target": rec.get("target", ""),
        "muscle_group": rec.get("muscle_group", ""),
        "secondary_muscles": rec.get("secondary_muscles") or [],
        "image": f"images/{img_src.name}",
        "gif_url": f"videos/{gif_src.name}",
    }
    if rid in instructions:
        item["instructions"] = instructions[rid]
    return item, gif_src, img_src


def canonical_name(name: str) -> str:
    value = norm(name)
    value = re.sub(r"\b(?:side|back|front) pov\b", "", value)
    value = re.sub(r"\bv \d+\b", "", value)
    return re.sub(r"\s+", " ", value).strip()


def select_exercises(lookup: dict, count: int):
    selected: list[tuple[str, str, dict, float]] = []
    used_files: set[str] = set()
    used_names: set[str] = set()
    role_counts = {role: 0 for role in ROLE_SPECS}

    # First satisfy per-role quotas so each muscle has genuine breadth.
    for role, spec in ROLE_SPECS.items():
        ranked = sorted(
            ((score(rec, spec), filename, rec) for filename, rec in lookup.items()),
            key=lambda row: (row[0], row[1]), reverse=True,
        )
        for points, filename, rec in ranked:
            if role_counts[role] >= spec["quota"] or len(selected) >= count:
                break
            if points < 90 or filename in used_files:
                continue
            cname = canonical_name(rec.get("name", filename))
            if cname in used_names:
                continue
            selected.append((role, filename, rec, points))
            used_files.add(filename)
            used_names.add(cname)
            role_counts[role] += 1

    # If strict quotas cannot fill the requested count, add the next best conventional
    # movement from any role, still deduplicating near-identical POV/name variants.
    if len(selected) < count:
        extras = []
        for role, spec in ROLE_SPECS.items():
            for filename, rec in lookup.items():
                if filename in used_files:
                    continue
                points = score(rec, spec)
                if points >= 95:
                    extras.append((points, role, filename, rec))
        extras.sort(key=lambda row: (row[0], row[2]), reverse=True)
        for points, role, filename, rec in extras:
            if len(selected) >= count:
                break
            if filename in used_files:
                continue
            cname = canonical_name(rec.get("name", filename))
            if cname in used_names:
                continue
            selected.append((role, filename, rec, points))
            used_files.add(filename)
            used_names.add(cname)
            role_counts[role] += 1

    return selected, role_counts


def main() -> int:
    parser = argparse.ArgumentParser(description="Build Gym Tracker v16.1 conventional exercise library from the local exercise dataset.")
    parser.add_argument("--source", default="~/gym-exercise-lookup")
    parser.add_argument("--dest", default=".")
    parser.add_argument("--count", type=int, default=TARGET_COUNT)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--allow-shrink", action="store_true", help="Allow replacing an existing library with fewer exercises.")
    args = parser.parse_args()

    source = Path(args.source).expanduser().resolve()
    dest = Path(args.dest).expanduser().resolve()
    try:
        lookup = load_lookup(source)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    instructions = instruction_map(source)
    selected, role_counts = select_exercises(lookup, max(1, args.count))
    if len(selected) < 120:
        print(f"ERROR: only {len(selected)} conventional exercises matched; refusing to replace the current library.", file=sys.stderr)
        return 2

    print(f"Gym Tracker media builder v16.1\nSelected {len(selected)} conventional exercises from {len(lookup)} source entries.\n")
    for role in ROLE_SPECS:
        print(f"  {role:18}: {role_counts[role]}")
    if len(selected) < args.count:
        print(f"\nNOTE: requested {args.count}; strict conventional filtering produced {len(selected)} unique movements.")

    report = []
    library = []
    media = []
    for role, filename, rec, points in selected:
        built = media_item(rec, filename, source, instructions, role)
        if not built:
            print(f"WARNING: skipping {filename}; its GIF or thumbnail is missing.", file=sys.stderr)
            continue
        item, gif_src, img_src = built
        library.append(item)
        media.append((item, gif_src, img_src))
        report.append(f"{role:18} | {filename:24} | {item['name']} | {item['equipment']} | score {points:.0f}")

    if len(library) < 120:
        print(f"ERROR: only {len(library)} selected exercises have complete media; current library left untouched.", file=sys.stderr)
        return 3

    existing_count = 0
    existing_path = dest / "exercise-library.json"
    if existing_path.is_file():
        try:
            existing_payload = json.loads(existing_path.read_text(encoding="utf-8"))
            existing_count = len(existing_payload) if isinstance(existing_payload, (list, dict)) else 0
        except Exception:
            existing_count = 0
    if existing_count and len(library) < existing_count and not args.allow_shrink:
        print(
            f"ERROR: new strict library has {len(library)} exercises but the current library has {existing_count}. "
            "Refusing to shrink it. Re-run with --allow-shrink only if that is intentional.",
            file=sys.stderr,
        )
        return 5

    if args.dry_run:
        return 0

    videos = dest / "videos"
    images = dest / "images"
    videos.mkdir(parents=True, exist_ok=True)
    images.mkdir(parents=True, exist_ok=True)

    # Deliberately do not prune old media: saved history can still reference it.
    copied: set[str] = set()
    for item, gif_src, img_src in media:
        for src, rel in ((gif_src, item["gif_url"]), (img_src, item["image"])):
            if rel in copied:
                continue
            shutil.copy2(src, dest / rel)
            copied.add(rel)

    missing = []
    for item in library:
        for field in ("gif_url", "image"):
            if not (dest / item[field]).is_file():
                missing.append(f"{item['name']}: {item[field]}")
    if missing:
        print("ERROR: generated library references missing media:", file=sys.stderr)
        for item in missing:
            print(f"  {item}", file=sys.stderr)
        return 4

    (dest / "exercise-library.json").write_text(json.dumps(library, ensure_ascii=False, indent=2), encoding="utf-8")
    (dest / "exercise-library-selection.txt").write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"\nWrote {len(library)} exercises to {dest}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
