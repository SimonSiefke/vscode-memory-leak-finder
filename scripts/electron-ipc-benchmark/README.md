# Electron IPC CI comparison

This investigation compares the same three revisions as the corrected local
benchmark for microsoft/vscode#330439:

| Variant                               | Commit                                     |
| ------------------------------------- | ------------------------------------------ |
| Buffer IPC baseline                   | `959031245ebb1fe077e0d512e1397c0ae82006e4` |
| Direct IPC before the marshalling fix | `d6352725adca1ebaebbabb24f65b63c88167fda3` |
| Direct IPC with the URI/VSBuffer fix  | `fb616229bd8383a07d0cdee17e5c844c9aa0a50c` |

The dedicated workflow runs on pushes to `ci/electron-ipc-benchmark` in
SimonSiefke/vscode-memory-leak-finder. It creates no PRs or GitHub comments.
Builds are produced on separate runners, but every benchmark runner downloads
all three builds and measures them sequentially. Three fresh Ubuntu runners
each measure 15 CPU launches and seven smoke runs per build, plus 333/332/332
startup launches: 997 startup samples per build in total.

The driver and fixture are pinned. SQLite is queried inside Electron before
accepting a build; built-in extension entrypoints and native module inventories
are checked. Missing native modules, failed activation, failed or unexecuted
tests, and changed smoke inventories invalidate runs. Instrumented timer files
are restored before smoke timing. Incomplete runs still upload their evidence.

Hardware instructions/cycles are only measured if the runner's `perf` probe
reports real positive counters. If the VM does not expose its PMU, those metrics
remain unavailable while startup and smoke comparisons continue.

These are complete development builds, matching the local comparison. They do
not establish performance for minified release packages or reproduce the old
issue's historical base and smoke selection. Hosted runners can also vary;
the report includes per-runner differences and confidence intervals with runner
and paired-block resampling. Do not compare raw startup times across hosts.

Download `ipc-comparison-report` for the combined report and `ipc-results-*`
for raw measurements, commands, product logs, runner metadata, and build hashes.

The x64 experiment is run `38431995751`. Its measurement steps use the original
driver commit `70240d6d77cf3725f8f59bd91146509a63da5b9c`. That commit's summary
parser includes timer provenance JSON in its sample glob. The report-only
workflow on `ci/electron-ipc-report` corrects the glob, verifies three successful
build jobs, and audits the completed measurement logs for all three pilots,
every startup index, and all 21 smoke passes on each host. It also rejects any
errors other than the two known summary failures. This avoids stale in-progress
step metadata returned by GitHub after a job has completed. The workflow then
aggregates the original artifacts and includes `source-audit.json` in its report.
It does not rerun measurements or change product code.

ARM run `38436288594` provides hardware-counter measurements separately: three
Ubuntu 24.04 ARM hosts, 15 launches per version per host, 45 launches per version
in total. Its artifact is `ipc-arm-cpu-comparison-report`. Keep architecture and
measurement type separate when interpreting the results.
