import json
import os
from pathlib import Path
import subprocess
import sys


root = Path("pmu-probe")
root.mkdir(exist_ok=True)
result = subprocess.run(["perf", "stat", "-x,", "-e", "instructions:u,cycles:u", "--", sys.executable, "-c", "print(sum(i*i for i in range(3000000)))"], capture_output=True, text=True, timeout=30)
(root / "perf.txt").write_text(result.stdout + result.stderr)
counters = {}
for line in result.stderr.splitlines():
    fields = line.split(",")
    if len(fields) > 2 and fields[2] in ["instructions:u", "cycles:u"]:
        try:
            counters[fields[2]] = float(fields[0])
        except ValueError:
            pass
available = result.returncode == 0 and all(counters.get(name, 0) > 0 for name in ["instructions:u", "cycles:u"])
report = {
    "runner": os.environ.get("PROBE_RUNNER"),
    "available": available,
    "counters": counters,
    "exitCode": result.returncode,
    "cpu": subprocess.check_output(["lscpu"], text=True),
    "kernel": subprocess.check_output(["uname", "-a"], text=True).strip(),
    "eventSources": sorted(p.name for p in Path("/sys/bus/event_source/devices").iterdir()),
    "paranoid": Path("/proc/sys/kernel/perf_event_paranoid").read_text().strip(),
}
(root / "probe.json").write_text(json.dumps(report, indent=2))
message = f"{report['runner']}: hardware counters available = {available}; values = {counters}"
print(message)
with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as stream:
    stream.write(message + "\n\n```text\n" + result.stderr + "\n```\n")
