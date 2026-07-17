#!/usr/bin/env python3
"""Synthesize ranking JSONL for future constrained-label LoRA (achievable v1 scale)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from kangchiao_data.training.synthesize_rankings import synthesize, write_jsonl  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=1000, help="Total synthetic examples")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    catalog = json.loads((ROOT / "data" / "curated" / "tools.json").read_text(encoding="utf-8"))
    tools = catalog["tools"]
    train, valid, test = synthesize(tools, n=args.n, seed=args.seed)

    out_dir = ROOT / "data" / "training"
    write_jsonl(out_dir / "train.jsonl", train)
    write_jsonl(out_dir / "valid.jsonl", valid)
    write_jsonl(out_dir / "test.jsonl", test)

    card = f"""# Ranking dataset card (synthetic v1)

- Generated for: Kang Chiao AI Navigator Internal Prototype
- Method: tag-scoring teacher labels + randomized candidate order + abstain (N)
- Total requested: {args.n}
- train/valid/test: {len(train)} / {len(valid)} / {len(test)}
- reviewStatus: synthetic_v1 (not human_verified)
- Next: human spot-check + tokenizer single-token label verification before LoRA
- Do NOT treat accuracy on this set as real-world proof
"""
    (out_dir / "dataset_card.md").write_text(card, encoding="utf-8")
    print(card)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
