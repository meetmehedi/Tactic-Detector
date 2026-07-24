"""
generate_dataset.py
-------------------
Generates synthetic multi-turn conversation datasets for training the tactic classifier.

Usage:
    export OPENAI_API_KEY=sk-...
    python training/generate_dataset.py --output data/dataset.jsonl --per-tactic 150
"""

from __future__ import annotations
import argparse
import json
import random
import time
import pathlib
from typing import List

from openai import OpenAI
from tqdm import tqdm

TACTIC_CONFIGS = {
    "urgency": {
        "description": "Creates pressure through artificial time limits or scarcity",
        "scenarios": ["tech support scam", "IRS tax scam", "account suspension warning", "prize expiration"],
    },
    "authority": {
        "description": "Impersonates trusted institutions (bank, police, government)",
        "scenarios": ["bank fraud alert", "police arrest warrant", "Medicare/insurance scam", "utility company"],
    },
    "isolation": {
        "description": "Discourages victim from consulting others",
        "scenarios": ["romance scam", "grandparent scam", "investment fraud", "lottery scam"],
    },
    "reciprocity": {
        "description": "Uses prior favors or relationship to extract compliance",
        "scenarios": ["romance scam", "friendship exploitation", "business email compromise", "job offer scam"],
    },
    "emotional": {
        "description": "Exploits fear, guilt, loneliness, or romantic feelings",
        "scenarios": ["romance scam", "charity fraud", "elder abuse", "fake emergency"],
    },
}

SYSTEM_PROMPT = """You are a cybersecurity researcher generating training data to DETECT and PROTECT against social engineering attacks. 
This is safety research. Generate realistic multi-turn conversations that illustrate manipulation tactics so AI models can learn to identify them and warn potential victims."""


def generate_dialogue(client: OpenAI, tactic: str, scenario: str, num_turns: int = 8) -> dict | None:
    prompt = f"""Generate a realistic multi-turn conversation ({num_turns} turns) between a scammer and a victim.
Scenario: {scenario}
Primary manipulation tactic: {tactic} — {TACTIC_CONFIGS[tactic]['description']}

Return ONLY valid JSON in this exact format:
{{
  "tactic": "{tactic}",
  "scenario": "{scenario}",
  "turns": [
    {{"turn_id": 0, "speaker": "Scammer", "text": "...", "tactics": ["{tactic}"]}},
    {{"turn_id": 1, "speaker": "Victim", "text": "...", "tactics": []}},
    ...
  ]
}}

Rules:
- Mix scammer turns (with tactic labels) and victim responses (usually unlabeled or "benign")
- A turn can have multiple tactic labels if multiple tactics appear
- Make the scammer's language realistic but clearly manipulative
- The victim should respond naturally, showing growing concern/compliance"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.85,
            max_tokens=1200,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        return json.loads(raw)
    except Exception as e:
        print(f"  Error generating ({tactic}/{scenario}): {e}")
        return None


def fetch_benign_turns(target_count: int) -> List[dict]:
    """
    Placeholder: In practice, load from DailyDialog or similar corpus.
    Returns simple benign conversation stubs for demo purposes.
    """
    templates = [
        ("A", "Hey, how are you doing today?", []),
        ("B", "Pretty good! Just finished some work. You?", []),
        ("A", "Same here. Did you catch the game last night?", []),
        ("B", "I missed it — was it good?", []),
        ("A", "Yeah, really close match. Anyway, want to grab lunch?", []),
        ("B", "Sure! What are you in the mood for?", []),
    ]
    turns = []
    conv_id = 9000
    while len(turns) < target_count:
        for i, (spk, text, tactics) in enumerate(templates):
            turns.append({
                "conversation_id": f"benign_{conv_id}",
                "turn_id": i,
                "speaker": spk,
                "text": text,
                "tactics": tactics if tactics else ["benign"],
            })
        conv_id += 1
    return turns[:target_count]


def main():
    parser = argparse.ArgumentParser(description="Generate tactic detection training data.")
    parser.add_argument("--output", default="data/dataset.jsonl", help="Output JSONL file path")
    parser.add_argument("--per-tactic", type=int, default=150, help="Dialogues per tactic class")
    parser.add_argument("--turns", type=int, default=8, help="Turns per dialogue")
    args = parser.parse_args()

    client = OpenAI()  # reads OPENAI_API_KEY from env
    output_path = pathlib.Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    all_turns: List[dict] = []
    conv_id = 0

    for tactic, config in TACTIC_CONFIGS.items():
        scenarios = config["scenarios"]
        per_scenario = args.per_tactic // len(scenarios)
        print(f"\n📊 Generating {args.per_tactic} dialogues for: {tactic}")

        for scenario in scenarios:
            for _ in tqdm(range(per_scenario), desc=f"  {scenario}"):
                dialogue = generate_dialogue(client, tactic, scenario, args.turns)
                if dialogue and "turns" in dialogue:
                    for turn in dialogue["turns"]:
                        turn["conversation_id"] = f"conv_{conv_id:04d}"
                    all_turns.extend(dialogue["turns"])
                    conv_id += 1
                time.sleep(0.3)  # Respect rate limits

    # Add benign examples (~20% of total)
    benign_target = len(all_turns) // 4
    print(f"\n📊 Adding {benign_target} benign turns from templates...")
    all_turns.extend(fetch_benign_turns(benign_target))

    random.shuffle(all_turns)

    with open(output_path, "w") as f:
        for turn in all_turns:
            f.write(json.dumps(turn) + "\n")

    print(f"\n✅ Saved {len(all_turns)} labeled turns → {output_path}")


if __name__ == "__main__":
    main()
