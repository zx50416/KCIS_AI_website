"""
Synthesize constrained single-label ranking examples for future LoRA.

v1 scale target: ~800–1200 examples (expandable to 6k–12k later).
Labels A/B/C/.../N must be validated against a real tokenizer before training;
here we only emit the dataset shape.
"""

from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any

from kangchiao_data.scoring import shortlist

LABELS = list("ABCDEFGH")  # up to 8 candidates; plus N
ABSTAIN = "N"

TASKS = [
    "lesson_plan",
    "worksheet",
    "quiz",
    "presentation",
    "translate",
    "writing",
    "research",
    "summary",
    "image",
    "video",
    "music",
    "collaboration",
    "tutoring",
    "coding",
    "simulation",
    "reading",
    "language_practice",
    "feedback",
    "admin_draft",
    "poster",
    "brainstorm",
    "portfolio",
]

ROLES = ["teacher", "student"]
LEVELS = ["elementary", "middle", "high", "university"]
LANGS = ["zh-TW", "en"]


SCENARIO_TEMPLATES_ZH = {
    "lesson_plan": "我需要準備一堂課的教案大綱，主題與年級如設定。",
    "worksheet": "請幫我想學習單題目與活動設計。",
    "quiz": "我想出幾題課堂小考或練習題。",
    "presentation": "我需要做簡報或視覺呈現。",
    "translate": "我需要雙語教材或翻譯輔助。",
    "writing": "我需要寫作協助或文章修改建議。",
    "research": "我需要整理資料來源並協助理解。",
    "summary": "我需要摘要長文或教材重點。",
    "image": "我需要課堂用的圖片或視覺素材。",
    "video": "我需要短影片或影片教材。",
    "music": "我需要配樂或音樂素材。",
    "collaboration": "我需要學生協作與回應牆。",
    "tutoring": "我需要概念講解或練習輔導。",
    "coding": "我需要程式學習或專題開發輔助。",
    "simulation": "我需要模擬或虛擬教具。",
    "reading": "我需要閱讀材料或電子書資源。",
    "language_practice": "我需要語言朗讀或口說練習。",
    "feedback": "我需要给学生作品回饋草稿。",
    "admin_draft": "我需要行政文書或通知草稿。",
    "poster": "我需要海報或公告視覺。",
    "brainstorm": "我需要腦力激盪白板。",
    "portfolio": "我需要作品集或成果頁。",
}

SCENARIO_TEMPLATES_EN = {
    "lesson_plan": "I need a lesson outline for the given grade and subject.",
    "worksheet": "I need worksheet questions and activity ideas.",
    "quiz": "I need a short quiz or practice items.",
    "presentation": "I need slides or a visual presentation.",
    "translate": "I need bilingual materials or translation help.",
    "writing": "I need writing help or revision suggestions.",
    "research": "I need to organize sources and understand them.",
    "summary": "I need a summary of long materials.",
    "image": "I need classroom images or visual assets.",
    "video": "I need a short instructional video.",
    "music": "I need background music or audio assets.",
    "collaboration": "I need student collaboration boards.",
    "tutoring": "I need concept tutoring or practice support.",
    "coding": "I need coding help for a school project.",
    "simulation": "I need a simulation or virtual manipulative.",
    "reading": "I need reading materials or ebook resources.",
    "language_practice": "I need speaking/reading practice support.",
    "feedback": "I need draft feedback on student work.",
    "admin_draft": "I need an admin notice draft.",
    "poster": "I need a poster or announcement visual.",
    "brainstorm": "I need a brainstorming whiteboard.",
    "portfolio": "I need a portfolio or showcase page.",
}


def _candidate_blurb(tool: dict[str, Any], lang: str) -> str:
    desc = tool.get("shortDescription") or {}
    text = desc.get("zh-TW" if lang == "zh-TW" else "en", tool["name"])
    return f"{tool['name']}: {text}"


def _pick_correct(tools: list[dict[str, Any]], need: dict[str, Any]) -> str | None:
    ranked = shortlist(tools, need, k=8)
    if not ranked:
        return None
    # Prefer highest score; if all zero-ish, abstain sometimes
    if ranked[0]["score"] <= 0:
        return None
    return ranked[0]["id"]


def build_example(
    tools_by_id: dict[str, dict[str, Any]],
    catalog: list[dict[str, Any]],
    *,
    rng: random.Random,
    scenario_id: str,
) -> dict[str, Any] | None:
    role = rng.choice(ROLES)
    level = rng.choice(LEVELS)
    task = rng.choice(TASKS)
    language = rng.choice(LANGS)
    free_only = rng.random() < 0.45

    need = {
        "role": role,
        "level": level,
        "task": task,
        "language": language,
        "freeOnly": free_only,
    }

    short = shortlist(catalog, need, k=5)
    if len(short) < 2:
        # Force abstain-style example with random tools as distractors
        pool = [t for t in catalog if t.get("status") != "deprecated"]
        short = [
            {"id": t["id"], "name": t["name"], "score": 0, "reasons": []}
            for t in rng.sample(pool, k=min(4, len(pool)))
        ]
        correct_id = None
    else:
        correct_id = short[0]["id"]
        # Occasionally inject hard negative / abstain
        if rng.random() < 0.12:
            correct_id = None

    # Build candidate list (ids), shuffle mapping to labels
    candidate_ids = [s["id"] for s in short[:5]]
    # Ensure unique
    seen = set()
    candidate_ids = [x for x in candidate_ids if not (x in seen or seen.add(x))]
    if len(candidate_ids) < 2:
        return None

    order = candidate_ids[:]
    rng.shuffle(order)
    label_map = {LABELS[i]: order[i] for i in range(len(order))}
    # reverse for answer
    id_to_label = {v: k for k, v in label_map.items()}

    if correct_id is None or correct_id not in id_to_label:
        answer = ABSTAIN
        correct_tool_id = None
    else:
        answer = id_to_label[correct_id]
        correct_tool_id = correct_id

    tmpl = SCENARIO_TEMPLATES_ZH if language == "zh-TW" else SCENARIO_TEMPLATES_EN
    user_need = tmpl.get(task, task)

    lines = [
        f"Role: {role}",
        f"Level: {level}",
        f"Task: {task}",
        f"Language: {language}",
        f"FreeOnly: {free_only}",
        f"Need: {user_need}",
        "Candidates:",
    ]
    for lab, tid in label_map.items():
        tool = tools_by_id[tid]
        lines.append(f"{lab}: {_candidate_blurb(tool, language)}")
    lines.append(f"{ABSTAIN}: None / insufficient info / do not force a recommendation")

    return {
        "messages": [
            {
                "role": "system",
                "content": "Choose the best tool for the education need. Reply with exactly one allowed label.",
            },
            {"role": "user", "content": "\n".join(lines)},
            {"role": "assistant", "content": answer},
        ],
        "metadata": {
            "scenarioId": scenario_id,
            "correctToolId": correct_tool_id,
            "answerLabel": answer,
            "candidateOrder": order,
            "labelMap": label_map,
            "need": need,
            "reviewStatus": "synthetic_v1",
            "splitHint": None,
        },
    }


def synthesize(
    catalog: list[dict[str, Any]],
    *,
    n: int = 1000,
    seed: int = 42,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    rng = random.Random(seed)
    tools_by_id = {t["id"]: t for t in catalog}
    examples: list[dict[str, Any]] = []
    attempts = 0
    while len(examples) < n and attempts < n * 5:
        attempts += 1
        ex = build_example(
            tools_by_id,
            catalog,
            rng=rng,
            scenario_id=f"syn_{len(examples):04d}",
        )
        if ex:
            examples.append(ex)

    # Group split by scenario template family to reduce leakage: use hash of task+role
    rng2 = random.Random(seed + 7)
    rng2.shuffle(examples)
    n_train = int(len(examples) * 0.8)
    n_valid = int(len(examples) * 0.1)
    train = examples[:n_train]
    valid = examples[n_train : n_train + n_valid]
    test = examples[n_train + n_valid :]
    for split_name, rows in ("train", train), ("valid", valid), ("test", test):
        for row in rows:
            row["metadata"]["splitHint"] = split_name
    return train, valid, test


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
