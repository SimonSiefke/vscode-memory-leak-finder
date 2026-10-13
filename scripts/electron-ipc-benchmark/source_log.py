import hashlib
import json
import re


VARIANTS = {"buffer", "before", "after"}


def verify_log(job_name, log):
    match = re.fullmatch(r"benchmark \((\d+), (\d+)\)", job_name)
    if not match:
        raise RuntimeError(f"Unexpected measurement job: {job_name}")
    replica, count = map(int, match.groups())
    if {1: 333, 2: 332, 3: 332}.get(replica) != count:
        raise RuntimeError("Unexpected startup sample plan")

    pilots = re.findall(r"\bACCEPT pilot (\d+) (buffer|before|after):", log)
    if len(pilots) != 3 or set(pilots) != {("0", v) for v in VARIANTS}:
        raise RuntimeError(f"Incomplete pilot execution: {job_name}")
    smoke = re.findall(r"\bACCEPT smoke (\d+) (buffer|before|after):", log)
    if len(smoke) != 21 or set(smoke) != {(str(i), v) for i in range(7) for v in VARIANTS}:
        raise RuntimeError(f"Incomplete smoke execution: {job_name}")

    rows = []
    for line in log.splitlines():
        sample = re.search(r'(\{"variant":.*\})$', line)
        if sample:
            rows.append(json.loads(sample.group(1)))
    if len(rows) != 3 * (count + 3):
        raise RuntimeError(f"Incomplete startup execution: {job_name}")
    for variant in VARIANTS:
        selected = [row for row in rows if row["variant"] == variant]
        if len(selected) != count + 3 or {row["index"] for row in selected} != set(range(-3, count)):
            raise RuntimeError(f"Missing or duplicate startup index: {job_name} {variant}")
        if any(not (0 < row["mainToTimerReady"] < 60000 and row["elapsed"] > 0) or row["shutdownForced"] for row in selected):
            raise RuntimeError(f"Invalid startup measurement: {job_name} {variant}")

    errors = [line for line in log.splitlines() if "##[error]" in line]
    if len(errors) != 2 or log.count("KeyError: 'warmup'") != 2 or any("Process completed with exit code 1." not in line for line in errors):
        raise RuntimeError(f"Unexpected source failure: {job_name}")
    return {
        "replica": replica,
        "startupSamplesPerVariant": count,
        "excludedWarmupsPerVariant": 3,
        "smokeRunsPerVariant": 7,
        "pilots": 3,
        "forcedShutdowns": 0,
        "knownSummaryErrors": 2,
        "logSHA256": hashlib.sha256(log.encode()).hexdigest(),
    }
