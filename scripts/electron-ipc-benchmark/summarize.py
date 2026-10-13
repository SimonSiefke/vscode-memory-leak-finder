import argparse
import csv
import json
from pathlib import Path
import random
import statistics
import sys


VARIANTS = ["buffer", "before", "after"]
METRICS = ["instructions", "cycles", "mainToTimerReady", "elapsed", "smokeSeconds"]
COMMITS = {
    "buffer": "959031245ebb1fe077e0d512e1397c0ae82006e4",
    "before": "d6352725adca1ebaebbabb24f65b63c88167fda3",
    "after": "fb616229bd8383a07d0cdee17e5c844c9aa0a50c",
}


def distribution(values):
    if not values:
        return {"count": 0}
    return {"count": len(values), "mean": statistics.mean(values), "median": statistics.median(values), "sampleStandardDeviation": statistics.stdev(values) if len(values) > 1 else None}


def load(root):
    environment = json.loads((root / "environment.json").read_text()) if (root / "environment.json").exists() else {}
    perf = json.loads((root / "perf-capability.json").read_text()) if (root / "perf-capability.json").exists() else {"available": False, "reason": "No capability probe completed"}
    values = {metric: {v: [] for v in VARIANTS} for metric in METRICS}
    blocks = {metric: {v: {} for v in VARIANTS} for metric in METRICS}
    for variant in VARIANTS:
        for filename in sorted(root.glob(f"evidence/cpu-*-{variant}/accepted.json")):
            row = json.loads(filename.read_text())
            if row["sha"] != COMMITS[variant]:
                raise RuntimeError("CPU sample revision mismatch")
            for metric in ["instructions", "cycles"]:
                sample = [s[metric] for s in row["samples"]]
                values[metric][variant].extend(sample)
                blocks[metric][variant][row["block"]] = statistics.mean(sample)
        for filename in sorted(root.glob(f"startup/{variant}-*.json")):
            row = json.loads(filename.read_text())
            if row["warmup"]:
                continue
            if row["sha"] != COMMITS[variant]:
                raise RuntimeError("Startup sample revision mismatch")
            for metric in ["mainToTimerReady", "elapsed"]:
                values[metric][variant].append(row[metric])
                blocks[metric][variant][row["index"]] = row[metric]
        for filename in sorted(root.glob(f"evidence/smoke-*-{variant}/accepted.json")):
            row = json.loads(filename.read_text())
            if row["sha"] != COMMITS[variant] or row["passing"] != 19 or row["pending"] != 11:
                raise RuntimeError("Invalid smoke sample")
            values["smokeSeconds"][variant].append(row["duration"])
            blocks["smokeSeconds"][variant][row["block"]] = row["duration"]
    cpu_only = environment.get("benchmarkMode") == "cpu"
    expected = {"instructions": 15 if perf["available"] else 0, "cycles": 15 if perf["available"] else 0, "mainToTimerReady": environment.get("startupSamples", 0), "elapsed": environment.get("startupSamples", 0), "smokeSeconds": 0 if cpu_only else 7}
    complete = bool(environment) and all(len(values[m][v]) == expected[m] for m in METRICS for v in VARIANTS)
    complete = complete and all((root / f"evidence/pilot-00-{v}/accepted.json").exists() for v in VARIANTS)
    return {"root": str(root), "environment": environment, "perf": perf, "values": values, "blocks": blocks, "expected": expected, "complete": complete}


def compare(runs, metric, old, new):
    paired = []
    medians = []
    for run in runs:
        a = run["blocks"][metric][old]
        b = run["blocks"][metric][new]
        keys = sorted(a.keys() & b.keys())
        if not keys:
            continue
        paired.append([(a[k], b[k]) for k in keys])
        medians.append(100 * (statistics.median(run["values"][metric][new]) / statistics.median(run["values"][metric][old]) - 1))
    if not paired:
        return None

    def effect(pairs):
        return 100 * (sum(p[1] for p in pairs) / sum(p[0] for p in pairs) - 1)

    per_runner = [effect(pairs) for pairs in paired]
    rng = random.Random(330439)
    resamples = []
    # Resample runners first, then their matched blocks. Keep all three builds
    # on one runner together; raw measurements from different hosts are not pairs.
    for _ in range(10000):
        chosen = rng.choices(paired, k=len(paired))
        resamples.append(statistics.mean(effect(rng.choices(pairs, k=len(pairs))) for pairs in chosen))
    resamples.sort()
    return {"percentChangeOfMeans": statistics.mean(per_runner), "percentChangeOfMedians": statistics.mean(medians), "perRunnerMeanChanges": per_runner, "meanChange95CI": [resamples[249], resamples[9749]], "pairedBlocksPerRunner": [len(p) for p in paired], "runners": len(paired), "bootstrapIterations": len(resamples)}


def summarize(root, aggregate=False, require_complete=False):
    directories = sorted(root.glob("ipc-results-*")) if aggregate else [root]
    runs = [load(p) for p in directories]
    architectures = {r["environment"].get("architecture") for r in runs if r["environment"]}
    if len(architectures) > 1:
        raise RuntimeError("Cannot combine hardware-counter comparisons across architectures")
    root.mkdir(parents=True, exist_ok=True)
    complete = bool(runs) and all(r["complete"] for r in runs) and (len(runs) == 3 if aggregate else True)
    summary = {
        "complete": complete,
        "architecture": next(iter(architectures), None),
        "variants": COMMITS,
        "runners": [{"environment": r["environment"], "perf": r["perf"], "complete": r["complete"], "expected": r["expected"]} for r in runs],
        "methodology": "Development builds of the same source revisions as the corrected local comparison. CPU-only runs use ARM runners with verified hardware counters; do not compare their absolute counts or relative effects directly to x64 as proof of a historical x64 improvement. All variants run sequentially on each runner, in randomized CPU blocks of three launches. Aggregate effects average within-runner ratios. Confidence intervals resample runners and their matched blocks; three hosts provide limited evidence of host variation.",
        "metrics": {},
    }
    rows = []
    for metric in METRICS:
        per_variant = {v: distribution([value for r in runs for value in r["values"][metric][v]]) for v in VARIANTS}
        comparisons = {}
        for old, new in [("before", "after"), ("buffer", "after"), ("buffer", "before")]:
            result = compare(runs, metric, old, new)
            if result:
                comparisons[f"{new}_vs_{old}"] = result
        summary["metrics"][metric] = {"variants": per_variant, "comparisons": comparisons}
        for run in runs:
            for variant in VARIANTS:
                rows.extend((run["environment"].get("replica"), metric, variant, i, value) for i, value in enumerate(run["values"][metric][variant]))
    (root / "summary.json").write_text(json.dumps(summary, indent=2))
    with (root / "samples.csv").open("w", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["runner", "metric", "variant", "sample", "value"])
        writer.writerows(rows)
    report = ["# Electron IPC benchmark", "", f"Complete: **{complete}**. Runners: {len(runs)}. Architecture: {summary['architecture']}.", "", "Positive changes mean more instructions/cycles or longer duration.", "", "| Metric | Samples per variant | Fixed vs pre-fix, mean (95% CI) | Fixed vs buffer, mean (95% CI) | Pre-fix vs buffer, mean (95% CI) |", "| --- | ---: | ---: | ---: | ---: |"]
    for metric, data in summary["metrics"].items():
        entries = []
        for name in ["after_vs_before", "after_vs_buffer", "before_vs_buffer"]:
            c = data["comparisons"].get(name)
            entries.append("unavailable" if not c else f"{c['percentChangeOfMeans']:+.3f}% [{c['meanChange95CI'][0]:+.3f}%, {c['meanChange95CI'][1]:+.3f}%]")
        counts = "/".join(str(data["variants"][v]["count"]) for v in VARIANTS)
        report.append(f"| {metric} | {counts} | " + " | ".join(entries) + " |")
    report.extend(["", "Sample counts are buffer / pre-fix / fixed. Unsupported hardware counters are reported as unavailable, never as zero work.", "", summary["methodology"], "", "## Within-runner mean changes", ""])
    for metric, data in summary["metrics"].items():
        for name, c in data["comparisons"].items():
            report.append(f"- {metric}, {name}: " + ", ".join(f"{x:+.3f}%" for x in c["perRunnerMeanChanges"]))
    for run in runs:
        if not run["perf"]["available"]:
            report.extend(["", f"Runner {run['environment'].get('replica')}: {run['perf'].get('reason')}"])
    (root / "report.md").write_text("\n".join(report) + "\n")
    print("\n".join(report), flush=True)
    if require_complete and not complete:
        raise RuntimeError("Incomplete benchmark; see partial evidence and per-runner counts")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--aggregate", action="store_true")
    parser.add_argument("--require-complete", action="store_true")
    args = parser.parse_args()
    summarize(args.root, args.aggregate, args.require_complete)
