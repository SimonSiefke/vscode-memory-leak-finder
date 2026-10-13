import json
import os
from pathlib import Path
import subprocess
import time
from source_log import verify_log


REPO = "SimonSiefke/vscode-memory-leak-finder"
SOURCE_SHA = "70240d6d77cf3725f8f59bd91146509a63da5b9c"
run_id = int(os.environ["SOURCE_RUN_ID"])


def request(path):
    for attempt in range(1, 6):
        try:
            return subprocess.check_output(["gh", "api", "--allow-escape-sequences", f"repos/{REPO}/actions/{path}"], text=True, timeout=45)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            if attempt == 5:
                raise
            print(f"Temporary API failure; retry {attempt}/4 for {path}", flush=True)
            time.sleep(min(5 * attempt, 20))


def api(path):
    return json.loads(request(path))


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
audits = []
for job in benchmarks:
    if job["status"] != "completed":
        raise RuntimeError(f"Source job is not complete: {job['name']}")
    # The API can retain an in-progress step after its job has completed.
    # Audit actual accepted executions in the immutable completed job log.
    audit = verify_log(job["name"], request(f"jobs/{job['id']}/logs"))
    audits.append(dict(audit, jobId=job["id"]))
if {audit["replica"] for audit in audits} != {1, 2, 3}:
    raise RuntimeError("Missing or duplicate measurement host")
Path("results").mkdir(exist_ok=True)
Path("results/source-audit.json").write_text(json.dumps({"sourceRun": run_id, "sourceSHA": SOURCE_SHA, "jobs": audits}, indent=2) + "\n")
print("All recorded measurements passed; only the two known summary errors per host are allowed.", flush=True)
