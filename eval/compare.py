"""Compare baseline vs improved metrics side by side.

Baseline-effective granularity = chunk-level (what the current pipeline returns).
Improved-effective granularity = section-level (parent-document dedupe).
Also prints the apples-to-apples section-level delta to isolate the chunking change
(#1-#3) from the retrieval change (#4).
"""
import json

from common import EVAL_DIR

KS = (1, 3, 5, 10)


def load(tag):
    return json.loads((EVAL_DIR / f"metrics_{tag}.json").read_text(encoding="utf-8"))


def row(label, m, gran):
    r = m["metrics"][gran]["recall"]
    mrr = m["metrics"][gran]["mrr"]
    return f"{label:28s} R@1={r['1']:.3f} R@3={r['3']:.3f} R@5={r['5']:.3f} R@10={r['10']:.3f} MRR={mrr:.3f}"


def main():
    b, i = load("baseline"), load("improved")
    # metrics recall keys are ints in memory but strings after json round-trip
    def fix(m):
        for g in ("chunk", "section"):
            m["metrics"][g]["recall"] = {str(k): v for k, v in m["metrics"][g]["recall"].items()}
    fix(b); fix(i)

    print(f"n questions: {b['n']}\n")
    print(row("baseline (chunk, effective)", b, "chunk"))
    print(row("baseline (section)", b, "section"))
    print(row("improved (section, effective)", i, "section"))
    print(row("improved (chunk)", i, "chunk"))
    print()

    print("DELTA improved.section - baseline.chunk  (end-to-end pipeline effect):")
    bc, isec = b["metrics"]["chunk"], i["metrics"]["section"]
    for k in KS:
        d = isec["recall"][str(k)] - bc["recall"][str(k)]
        print(f"   R@{k:<2d} {bc['recall'][str(k)]:.3f} -> {isec['recall'][str(k)]:.3f}  ({d:+.3f})")
    dm = isec["mrr"] - bc["mrr"]
    print(f"   MRR  {bc['mrr']:.3f} -> {isec['mrr']:.3f}  ({dm:+.3f})")

    print("\nDELTA section-level only (isolates chunking #1-#3, same retrieval):")
    bs, isec2 = b["metrics"]["section"], i["metrics"]["section"]
    for k in KS:
        d = isec2["recall"][str(k)] - bs["recall"][str(k)]
        print(f"   R@{k:<2d} {bs['recall'][str(k)]:.3f} -> {isec2['recall'][str(k)]:.3f}  ({d:+.3f})")


if __name__ == "__main__":
    main()
