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
