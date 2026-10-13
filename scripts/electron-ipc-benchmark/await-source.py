import json
import os
import subprocess
import time


REPO = "SimonSiefke/vscode-memory-leak-finder"
SOURCE_SHA = "70240d6d77cf3725f8f59bd91146509a63da5b9c"
run_id = int(os.environ["SOURCE_RUN_ID"])


def api(path):
    return json.loads(subprocess.check_output(["gh", "api", f"repos/{REPO}/actions/{path}"], text=True))


deadline = time.monotonic() + 3 * 60 * 60
while True:
    run = api(f"runs/{run_id}")
    if run["head_sha"] != SOURCE_SHA or run["name"] != "Electron IPC benchmark":
        raise RuntimeError("Source run does not match the pinned benchmark experiment")
    if run["status"] == "completed":
        break
    if time.monotonic() > deadline:
        raise RuntimeError("Source measurement run did not finish within three hours")
    print(f"Waiting for source run {run_id}: {run['status']}", flush=True)
    time.sleep(30)

jobs = api(f"runs/{run_id}/jobs?per_page=100")["jobs"]
builds = [job for job in jobs if job["name"].startswith("build (")]
benchmarks = [job for job in jobs if job["name"].startswith("benchmark (")]
if len(builds) != 3 or any(job["conclusion"] != "success" for job in builds) or len(benchmarks) != 3:
    raise RuntimeError("Source run does not contain three successful builds and three measurement hosts")
required = {
    "Validate builds and run editor-open pilots",
    "Measure startup readiness",
    "Measure smoke-test duration",
}
for job in benchmarks:
    steps = {step["name"]: step for step in job["steps"]}
    if any(steps.get(name, {}).get("conclusion") != "success" for name in required):
        raise RuntimeError(f"Source measurements failed: {job['name']}")
    failed = {step["name"] for step in job["steps"] if step.get("conclusion") == "failure"}
    allowed = {"Verify complete samples and summarize", "Preserve summary and partial evidence"}
    if failed - allowed:
        raise RuntimeError(f"Unexpected source failure: {job['name']}: {failed}")
print("All source measurement steps passed; only the known summary failure is allowed.", flush=True)
