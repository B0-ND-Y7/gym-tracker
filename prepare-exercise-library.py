#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

TARGET_COUNT = 100

# A curated set of movement families. The selector favours common commercial-gym
# equipment and ordinary two-arm / two-leg variations. It intentionally avoids
# novelty exercises so the app feels varied without becoming random for its own sake.
ROLE_SPECS = {
    "push_horizontal": {
        "quota": 7,
        "any": [["chest", "press"], ["bench", "press"]],
        "prefer": ["leverage machine", "smith machine", "dumbbell", "barbell", "cable"],
        "boost": ["seated", "lever", "machine", "horizontal"],
        "exclude": ["incline", "decline", "single arm", "one arm", "alternating", "close grip", "floor", "ball"]
    },
    "push_incline": {
        "quota": 6,
        "all": ["incline", "press"],
        "prefer": ["leverage machine", "smith machine", "dumbbell", "barbell"],
        "boost": ["chest", "bench"],
        "exclude": ["single arm", "one arm", "alternating", "ball"]
    },
    "push_fly": {
        "quota": 5,
        "any": [["fly"], ["crossover"], ["pec", "deck"]],
        "prefer": ["leverage machine", "cable", "dumbbell"],
        "boost": ["chest", "seated", "standing"],
        "exclude": ["reverse", "rear", "single arm", "one arm", "ball"]
    },
    "push_vertical": {
        "quota": 6,
        "any": [["shoulder", "press"], ["military", "press"]],
        "prefer": ["leverage machine", "smith machine", "dumbbell", "barbell"],
        "boost": ["seated", "machine", "lever"],
        "exclude": ["single arm", "one arm", "alternating", "behind neck", "ball"]
    },
    "push_lateral": {
        "quota": 5,
        "all": ["lateral", "raise"],
        "prefer": ["leverage machine", "cable", "dumbbell"],
        "boost": ["seated", "lever", "machine"],
        "exclude": ["bent", "rear", "single arm", "one arm", "ball"]
    },
    "push_triceps": {
        "quota": 7,
        "any": [["triceps", "pushdown"], ["triceps", "extension"], ["tricep", "pushdown"], ["tricep", "extension"], ["assisted", "dip"]],
        "prefer": ["cable", "leverage machine", "assisted", "ez barbell", "dumbbell"],
        "boost": ["rope", "bar", "seated", "lever"],
        "exclude": ["single arm", "one arm", "kickback", "bench dip", "ball"]
    },
    "pull_vertical": {
        "quota": 8,
        "any": [["pulldown"], ["pull up"], ["pullup"], ["chin up"], ["chinup"]],
        "prefer": ["cable", "leverage machine", "assisted"],
        "boost": ["lat", "wide", "neutral", "close grip", "assisted"],
        "exclude": ["single arm", "one arm", "behind neck", "straight arm", "band"]
    },
    "pull_row": {
        "quota": 10,
        "any": [["row"]],
        "prefer": ["leverage machine", "cable", "smith machine", "dumbbell", "barbell"],
        "boost": ["seated", "chest supported", "lever", "machine"],
        "exclude": ["upright row", "single arm", "one arm", "renegade", "inverted", "ball"]
    },
    "pull_rear": {
        "quota": 6,
        "any": [["reverse", "fly"], ["rear", "delt"], ["face", "pull"]],
        "prefer": ["leverage machine", "cable", "dumbbell"],
        "boost": ["seated", "machine", "lever"],
        "exclude": ["single arm", "one arm", "ball"]
    },
    "pull_biceps": {
        "quota": 8,
        "any": [["curl"]],
        "prefer": ["leverage machine", "cable", "ez barbell", "dumbbell", "barbell"],
        "boost": ["preacher", "biceps", "seated", "lever", "machine", "hammer"],
        "exclude": ["wrist", "reverse wrist", "single arm", "one arm", "concentration", "ball", "zottman"]
    },
    "lower_compound": {
        "quota": 8,
        "any": [["leg", "press"], ["hack", "squat"], ["smith", "squat"], ["belt", "squat"], ["squat"]],
        "prefer": ["sled machine", "leverage machine", "smith machine", "barbell"],
        "boost": ["45", "hack", "smith", "lever", "machine"],
        "exclude": ["single leg", "one leg", "pistol", "sissy", "jump", "overhead", "front squat", "calf"]
    },
    "lower_quad": {
        "quota": 5,
        "all": ["leg", "extension"],
        "prefer": ["leverage machine", "cable"],
        "boost": ["lever", "machine", "seated"],
        "exclude": ["single leg", "one leg", "band"]
    },
    "lower_ham_curl": {
        "quota": 6,
        "all": ["leg", "curl"],
        "prefer": ["leverage machine", "cable"],
        "boost": ["seated", "lying", "lever", "machine"],
        "exclude": ["single leg", "one leg", "ball", "band"]
    },
    "lower_hinge": {
        "quota": 5,
        "any": [["romanian", "deadlift"], ["stiff", "leg", "deadlift"], ["stiff", "legged", "deadlift"], ["back", "extension"]],
        "prefer": ["smith machine", "barbell", "dumbbell", "leverage machine", "weighted"],
        "boost": ["smith", "45", "lever", "machine"],
        "exclude": ["single leg", "one leg", "kettlebell", "band", "ball"]
    },
    "lower_glute": {
        "quota": 5,
        "any": [["hip", "thrust"], ["glute", "bridge"], ["glute", "drive"]],
        "prefer": ["leverage machine", "smith machine", "barbell", "weighted"],
        "boost": ["lever", "machine", "smith"],
        "exclude": ["single leg", "one leg", "band", "ball"]
    },
    "lower_hip": {
        "quota": 4,
        "any": [["hip", "abduction"], ["hip", "adduction"], ["abductor"], ["adductor"]],
        "prefer": ["leverage machine", "cable"],
        "boost": ["seated", "lever", "machine"],
        "exclude": ["single leg", "one leg", "band", "lying"]
    },
    "lower_calf": {
        "quota": 4,
        "all": ["calf", "raise"],
        "prefer": ["leverage machine", "sled machine", "smith machine", "dumbbell"],
        "boost": ["standing", "seated", "lever", "machine"],
        "exclude": ["single leg", "one leg", "donkey", "jump"]
    },
}

ALLOWED_EQUIPMENT = {
    "leverage machine", "cable", "sled machine", "smith machine", "dumbbell",
    "barbell", "ez barbell", "assisted", "weighted", "body weight", "other"
}

GLOBAL_EXCLUDE = [
    "kettlebell", "band", "stability ball", "bosu", "medicine ball", "resistance band",
    "jump", "burpee", "handstand", "muscle up", "snatch", "clean and jerk", "olympic",
    "pistol", "sissy", "dragon flag", "wheel rollout", "neck", "wrist roller"
]


def norm(value: str) -> str:
    value = (value or "").lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def contains_all(text: str, parts) -> bool:
    return all(norm(x) in text for x in parts)


def matches(rec: dict, spec: dict) -> bool:
    name = norm(rec.get("name", ""))
    equipment = norm(rec.get("equipment", ""))
    if equipment not in ALLOWED_EQUIPMENT:
        return False
    if any(norm(x) in name for x in GLOBAL_EXCLUDE):
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
        return -10_000
    name = norm(rec.get("name", ""))
    equipment = norm(rec.get("equipment", ""))
    category = norm(rec.get("category", ""))
    target = norm(rec.get("target", ""))
    s = 100.0
    for i, pref in enumerate(spec.get("prefer", [])):
        if equipment == norm(pref):
            s += 55 - i * 5
            break
    for word in spec.get("boost", []):
        if norm(word) in name:
            s += 8
    # Prefer shorter, standard exercise names over very specialised variants.
    s -= max(0, len(name.split()) - 6) * 2.5
    if category and category in {"chest", "back", "shoulders", "upper arms", "upper legs", "lower legs"}:
        s += 2
    if target:
        s += 1
    return s


def optional_instruction_map(source: Path) -> dict[str, str]:
    candidates = [source / "data" / "exercises.json", source / "exercises.json"]
    for path in candidates:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        out = {}
        for rec in data if isinstance(data, list) else []:
            rid = str(rec.get("id", "")).zfill(4)
            ins = rec.get("instructions")
            if isinstance(ins, dict):
                ins = ins.get("en")
            if isinstance(ins, list):
                ins = " ".join(str(x) for x in ins)
            if isinstance(ins, str) and ins.strip():
                out[rid] = ins.strip()
        return out
    return {}


def main() -> int:
    ap = argparse.ArgumentParser(description="Build the ~100 exercise media library used by Gym Tracker v8.5.")
    ap.add_argument("--source", default="~/gym-exercise-lookup", help="Path to your gym-exercise-lookup project")
    ap.add_argument("--dest", default=".", help="Gym Tracker project directory")
    ap.add_argument("--count", type=int, default=TARGET_COUNT, help="Target exercise count (default: 100)")
    ap.add_argument("--dry-run", action="store_true", help="Show selections without copying files")
    args = ap.parse_args()

    source = Path(args.source).expanduser().resolve()
    dest = Path(args.dest).expanduser().resolve()
    lookup_path = source / "exercise-gif-lookup.json"
    if not lookup_path.exists():
        print(f"ERROR: cannot find {lookup_path}", file=sys.stderr)
        return 1

    lookup = json.loads(lookup_path.read_text(encoding="utf-8"))
    if not isinstance(lookup, dict) or not lookup:
        print("ERROR: exercise-gif-lookup.json is empty or invalid", file=sys.stderr)
        return 1

    instructions = optional_instruction_map(source)
    used: set[str] = set()
    selected: list[tuple[str, str, dict, float]] = []
    role_counts = {role: 0 for role in ROLE_SPECS}

    # First pass: fill each movement family to its quota.
    for role, spec in ROLE_SPECS.items():
        ranked = sorted(
            ((score(rec, spec), filename, rec) for filename, rec in lookup.items()),
            key=lambda item: item[0], reverse=True
        )
        for sc, filename, rec in ranked:
            if role_counts[role] >= spec["quota"] or len(selected) >= args.count:
                break
            if sc < 80 or filename in used:
                continue
            selected.append((role, filename, rec, sc))
            role_counts[role] += 1
            used.add(filename)

    # Second pass: if de-duplication or sparse categories left us short, fill from
    # the best remaining candidates across all roles while keeping the same filters.
    if len(selected) < args.count:
        extras = []
        for role, spec in ROLE_SPECS.items():
            for filename, rec in lookup.items():
                if filename in used:
                    continue
                sc = score(rec, spec)
                if sc >= 90:
                    extras.append((sc, role, filename, rec))
        extras.sort(reverse=True, key=lambda item: item[0])
        for sc, role, filename, rec in extras:
            if len(selected) >= args.count:
                break
            if filename in used:
                continue
            selected.append((role, filename, rec, sc))
            role_counts[role] += 1
            used.add(filename)

    if len(selected) < 80:
        print(f"ERROR: only found {len(selected)} suitable common-gym exercises; expected at least 80.", file=sys.stderr)
        return 2

    library = []
    report = []
    for role, filename, rec, sc in selected[:args.count]:
        gif_rel = Path(rec.get("gif_url") or f"videos/{filename}")
        img_rel = Path(rec.get("image") or f"images/{Path(filename).with_suffix('.jpg').name}")
        gif_src = source / "public" / gif_rel
        img_src = source / "public" / img_rel
        if not gif_src.exists() or not img_src.exists():
            print(f"ERROR: missing media for {filename}: {gif_src} / {img_src}", file=sys.stderr)
            return 3

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
        library.append(item)
        report.append(f"{role:18} | {filename:24} | {item['name']} | {item['equipment']}")

    print(f"Selected {len(library)} exercises.\n")
    for role in ROLE_SPECS:
        print(f"  {role:18}: {sum(1 for x in library if x['role']==role)}")
    print("\nPreview:\n" + "\n".join(report[:30]))
    if len(report) > 30:
        print(f"... and {len(report)-30} more")

    if args.dry_run:
        return 0

    video_dest = dest / "videos"
    image_dest = dest / "images"
    if video_dest.exists():
        shutil.rmtree(video_dest)
    if image_dest.exists():
        shutil.rmtree(image_dest)
    video_dest.mkdir(parents=True)
    image_dest.mkdir(parents=True)

    for item in library:
        shutil.copy2(source / "public" / item["gif_url"], dest / item["gif_url"])
        shutil.copy2(source / "public" / item["image"], dest / item["image"])

    (dest / "exercise-library.json").write_text(json.dumps(library, ensure_ascii=False, indent=2), encoding="utf-8")
    (dest / "exercise-library-selection.txt").write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"\nWrote {dest / 'exercise-library.json'}")
    print(f"Copied {len(library)} GIFs and {len(library)} thumbnails.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
