import importlib.util
import json
import os
from pathlib import Path
import random
import re
import shutil
import signal
import subprocess
import sys
import time


ROOT = Path(os.environ["IPC_BENCHMARK_ROOT"]).resolve()
PRODUCT_ROOT = Path(os.environ["IPC_PRODUCT_ROOT"]).resolve()
DRIVER = Path(__file__).resolve().parents[2]
VARIANTS = ["buffer", "before", "after"]
COMMITS = {
    "buffer": "959031245ebb1fe077e0d512e1397c0ae82006e4",
    "before": "d6352725adca1ebaebbabb24f65b63c88167fda3",
    "after": "fb616229bd8383a07d0cdee17e5c844c9aa0a50c",
}
FIXTURE_SHA = "ecb012634f104f7a8188d9e3610a4d2d65bef6f6"
SELECTION = r"VSCode Smoke Tests \(Electron\) (Preferences|Settings editor|Search|Quick Open|Language Features|Statusbar|Multiroot|Launch|Notebooks)"
ROOT.mkdir(parents=True, exist_ok=True)


def save(filename, value):
    filename = Path(filename)
    filename.parent.mkdir(parents=True, exist_ok=True)
    filename.write_text(json.dumps(value, indent=2))


def validate_logs(directory, destination):
    if not directory.is_dir():
        raise RuntimeError(f"Missing product logs: {directory}")
    errors = []
    logfiles = list(directory.rglob("*.log"))
    if not logfiles:
        raise RuntimeError(f"No product logs: {directory}")
    for filename in logfiles:
        text = filename.read_text(errors="replace")
        errors.extend(line for line in text.splitlines() if re.search(r"Cannot find module|Cannot find package|NODE_MODULE_VERSION|Activating extension .*failed", line))
    # Only logs and measurement data are uploaded, never raw proxy requests.
    shutil.copytree(directory, destination / "product-logs", dirs_exist_ok=True)
    if errors:
        save(destination / "setup-errors.json", errors)
        raise RuntimeError("Native module/activation errors invalidate this sample")


def probe():
    env = {
        "replica": int(os.environ.get("IPC_REPLICA", "1")),
        "startupSamples": int(os.environ.get("IPC_STARTUP_SAMPLES", "100")),
        "cpuSamples": 15,
        "smokeSamples": 7,
        "driverSha": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=DRIVER, text=True).strip(),
        "workflowRun": os.environ.get("GITHUB_RUN_ID"),
        "workflowAttempt": os.environ.get("GITHUB_RUN_ATTEMPT"),
        "runnerImage": os.environ.get("ImageVersion"),
        "variants": COMMITS,
        "fixtureSha": FIXTURE_SHA,
        "buildType": "complete development build, matching the corrected local comparison",
        "cpu": subprocess.check_output(["lscpu"], text=True),
        "kernel": subprocess.check_output(["uname", "-a"], text=True).strip(),
        "driverNode": subprocess.check_output([shutil.which("node"), "--version"], text=True).strip(),
        "productNode": subprocess.check_output([os.environ["IPC_PRODUCT_NODE"], "--version"], text=True).strip(),
    }
    save(ROOT / "environment.json", env)
    result = subprocess.run(["perf", "stat", "-x,", "-e", "instructions:u,cycles:u", "--", shutil.which("node"), "-e", "let n=0; for(let i=0;i<10000000;i++) n+=i; console.log(n)"], capture_output=True, text=True, timeout=30)
    (ROOT / "perf-probe.txt").write_text(result.stdout + result.stderr)
    counters = {}
    for line in result.stderr.splitlines():
        fields = line.split(",")
        if len(fields) > 2 and fields[2] in ["instructions:u", "cycles:u"]:
            try:
                counters[fields[2]] = float(fields[0])
            except ValueError:
                pass
    available = result.returncode == 0 and all(counters.get(k, 0) > 0 for k in ["instructions:u", "cycles:u"])
    save(ROOT / "perf-capability.json", {"available": available, "exitCode": result.returncode, "counters": counters, "reason": None if available else "Hosted runner does not expose usable instruction/cycle counters; see perf-probe.txt. CPU results are unavailable, never substituted."})
    print(f"Hardware performance counters available: {available}", flush=True)


def run(mode):
    if mode == "cpu" and not json.loads((ROOT / "perf-capability.json").read_text())["available"]:
        print("CPU benchmark unavailable on this runner; continuing startup and smoke timings.", flush=True)
        return
    if mode == "pilot":
        spec = importlib.util.spec_from_file_location("verify_build", Path(__file__).with_name("verify-build.py"))
        verifier = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(verifier)
        builds = {}
        for name in VARIANTS:
            product = PRODUCT_ROOT / name
            builds[name] = json.loads((product / "ipc-build.json").read_text())
            if builds[name]["sha"] != COMMITS[name]:
                raise RuntimeError("Build revision mismatch")
            verifier.verify(product)
        for name in VARIANTS:
            if builds[name]["electron"] != builds["after"]["electron"] or set(builds[name]["nativeModules"]) != set(builds["after"]["nativeModules"]):
                raise RuntimeError("Unmatched Electron versions or native module inventories")
        save(ROOT / "verified-builds.json", builds)
    if mode == "smoke":
        for name in VARIANTS:
            original = ROOT / f"startup/{name}-timer-original.js"
            timer = PRODUCT_ROOT / name / "out/vs/workbench/services/timer/browser/timerService.js"
            if not original.exists() or timer.read_bytes() != original.read_bytes():
                raise RuntimeError(f"Startup instrumentation was not restored: {name}")
    rounds = 5 if mode == "cpu" else 7 if mode == "smoke" else 1
    rng = random.Random(330439 + int(os.environ.get("IPC_REPLICA", "1")))
    schedule = []
    for block in range(rounds):
        order = VARIANTS.copy()
        rng.shuffle(order)
        schedule.extend((block, name) for name in order)
    save(ROOT / f"{mode}-schedule.json", schedule)
    for block, name in schedule:
        output = ROOT / "evidence" / f"{mode}-{block:02d}-{name}"
        output.mkdir(parents=True, exist_ok=True)
        product = PRODUCT_ROOT / name
        env = dict(os.environ, VSCODE_SKIP_PRELAUNCH="1")
        if mode in ["cpu", "pilot"]:
            cache = DRIVER / ".vscode-user-data-dir/CachedProfilesData/__default__profile__/extensions.builtin.cache"
            if cache.exists():
                cache.rename(output / "extensions.builtin.cache")
            logs = DRIVER / ".vscode-user-data-dir/logs"
            if logs.exists():
                shutil.rmtree(logs)
            result_path = DRIVER / ".vscode-memory-leak-finder-results/cpu-performance-counters-from-start/editor-open-text-file.json"
            if result_path.exists():
                result_path.unlink()
            command = ["xvfb-run", "-a", shutil.which("node"), "packages/cli/bin/test.js", "--run-skipped-tests-anyway", "--run-network-tests-anyway", "--only", "editor-open-text-file", "--runs", "1", "--startup-runs", "3" if mode == "cpu" else "1", "--workers", "1", "--vscode-path", str(product / "scripts/code.sh")]
            if mode == "cpu":
                command.extend(["--measure", "cpu-performance-counters-from-start"])
            cwd = DRIVER
        else:
            logs = product / ".build/logs/smoke-tests-electron"
            fixture = DRIVER / "smoke-fixture"
            if subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=fixture, text=True).strip() != FIXTURE_SHA:
                raise RuntimeError("Smoke fixture revision mismatch")
            product_node = os.environ["IPC_PRODUCT_NODE"]
            env["PATH"] = str(Path(product_node).parent) + ":" + env["PATH"]
            command = ["xvfb-run", "-a", product_node, "test/index.js", "--electronArgs=--no-sandbox", "--test-repo", str(fixture), "--fail-zero", "-g", SELECTION]
            cwd = product / "test/smoke"
        start = time.time()
        save(output / "provenance.json", {"block": block, "variant": name, "sha": COMMITS[name], "startedAt": start, "command": command, "cwd": str(cwd)})
        print(f"START {mode} {block} {name}", flush=True)
        with (output / "run.log").open("w") as log:
            process = subprocess.Popen(command, cwd=cwd, env=env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
            try:
                exit_code = process.wait(timeout=900)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
                raise RuntimeError(f"Timed out: {mode} {name}")
        duration = time.time() - start
        report = re.sub(r"\x1b\[[0-9;]*[a-zA-Z]", "", (output / "run.log").read_text())
        if exit_code or "SKIP (FAIL)" in report or re.search(r"\bFAIL\b|\d+ failing", report):
            print(report[-12000:])
            raise RuntimeError(f"Failed benchmark execution: {mode} {name}; exit={exit_code}")
        row = {"block": block, "variant": name, "sha": COMMITS[name], "duration": duration}
        if mode == "cpu":
            if not result_path.exists() or result_path.stat().st_mtime < start:
                raise RuntimeError("Missing fresh CPU result")
            raw = json.loads(result_path.read_text())
            samples = raw["cpuPerformanceCountersFromStart"]["samples"]
            if len(samples) != 3 or any(not (sample["instructions"] > 0 and sample["cycles"] > 0) for sample in samples):
                raise RuntimeError("Invalid CPU counter samples")
            shutil.copy2(result_path, output / "measure.json")
            row["samples"] = [{"instructions": s["instructions"], "cycles": s["cycles"]} for s in samples]
        elif mode == "smoke":
            passing = re.search(r"(\d+) passing", report)
            pending = re.search(r"(\d+) pending", report)
            inventory = (int(passing.group(1)) if passing else 0, int(pending.group(1)) if pending else 0)
            if inventory != (19, 11):
                raise RuntimeError(f"Changed smoke inventory: {inventory}")
            row.update(passing=inventory[0], pending=inventory[1], fixtureSha=FIXTURE_SHA)
        elif not re.search(r"editor-open-text-file.*(?:PASS|SKIP \(PASS\))|(?:PASS|SKIP \(PASS\)).*editor-open-text-file", report):
            print(report[-12000:])
            raise RuntimeError("Editor-open pilot did not execute successfully")
        validate_logs(logs, output)
        save(output / "accepted.json", row)
        print(f"ACCEPT {mode} {block} {name}: {duration:.3f}s", flush=True)


if __name__ == "__main__":
    probe() if sys.argv[1] == "probe" else run(sys.argv[1])
