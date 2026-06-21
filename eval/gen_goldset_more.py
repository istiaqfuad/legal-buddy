"""Append more LLM gold questions by harvesting across multiple Gemini model
buckets (each model id is a separate free-tier daily quota). Dedupes against the
existing goldset and against already-used sections. Writes back eval/goldset.json.
"""
import json
import time

from common import EVAL_DIR, GEMINI_API_KEY, gold_key
from gen_goldset import PROMPT, gather_candidates

TARGET_TOTAL = 60
MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-flash-latest"]


def main():
    from google import genai

    client = genai.Client(api_key=GEMINI_API_KEY)
    gold = json.loads((EVAL_DIR / "goldset.json").read_text(encoding="utf-8"))
    used = {g["gold_key"] for g in gold}
    print(f"existing: {len(gold)}; target {TARGET_TOTAL}")

    cands = [c for c in gather_candidates() if gold_key(c["act_file"], c["section_ord"]) not in used]
    import random

    random.Random(7).shuffle(cands)

    ci = 0
    for model in MODELS:
        if len(gold) >= TARGET_TOTAL:
            break
        print(f"-- harvesting with {model} (have {len(gold)}) --")
        for c in cands[ci:]:
            ci += 1
            if len(gold) >= TARGET_TOTAL:
                break
            gk = gold_key(c["act_file"], c["section_ord"])
            if gk in used:
                continue
            prompt = PROMPT.format(title=c["act_title"], content=c["content"][:3500])
            try:
                resp = client.models.generate_content(model=model, contents=prompt)
                q = (resp.text or "").strip().strip('"').split("\n")[0].strip()
            except Exception as e:
                msg = str(e)
                if "RESOURCE_EXHAUSTED" in msg:
                    print(f"   {model} quota exhausted, next model")
                    break
                continue
            if not q or len(q) < 10:
                continue
            used.add(gk)
            gold.append(
                {
                    "question": q,
                    "act_file": c["act_file"],
                    "section_ord": c["section_ord"],
                    "gold_key": gk,
                    "act_title": c["act_title"],
                    "section_title": c["section_title"],
                    "section_preview": c["content"][:160],
                    "gen_model": model,
                }
            )
            if len(gold) % 10 == 0:
                print(f"   total {len(gold)}")
            time.sleep(0.4)

    (EVAL_DIR / "goldset.json").write_text(
        json.dumps(gold, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"wrote {len(gold)} gold questions")


if __name__ == "__main__":
    main()
