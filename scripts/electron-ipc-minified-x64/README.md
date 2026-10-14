# Minified Electron IPC CI comparison

Build three pinned October revisions with the standard `vscode-linux-x64-min`
and `vscode-linux-arm64-min` tasks. Production build jobs require Code OSS
quality settings, complete built-in extensions, a working packaged SQLite
module, and the correct native Electron architecture. Build hashes and source
revisions accompany the artifacts. No pull requests or comments are created.

The separate architecture measurement workflows consume one explicitly pinned
build run and require all three jobs and artifacts for their architecture to
complete successfully. Three x64 hosts each compare all versions sequentially: 333/332/332
startup launches per version, plus seven smoke runs per version per host.
Three native ARM64 hosts each compare fifteen CPU launches per version.
Hardware counters must be real and positive; unsupported counters cannot be
reported as zero work. ARM CPU and x64 timings remain separate experiments.

Startup uses the original issue's internal recorder and direct packaged
executable, with no CDP debugger or profiler. It waits for
`ITimerService.whenReady()`, reports `mainToTimerReady` and `startupMetrics.ellapsed`,
and quits normally. The recorder is bundled/minified separately and temporarily
swapped into each package, with its matching product metadata, only for startup. Three warmups are excluded, launch
order cycles through all permutations, and launches have a one-second quiet
interval. Every launch must emit exactly one valid record for its pinned commit.
The pristine bundle is restored and hashes revalidated afterward.

Smoke uses the original issue's selection, pinned fixture revision, packaged
executable, and compiled smoke runner from the corresponding source revision.
One warmup per version is excluded. The first successful suite freezes the
actual executed test inventory, which must match all versions and repetitions.
Failures, missing modules and extension activation errors invalidate samples.

CPU uses the preserved benchmark driver's editor-open-text-file scenario, five
randomized blocks of three launches per version per host, and Linux perf PMU
instruction/cycle counters. A one-launch scenario pilot is required first.
CPU and smoke run pristine packages without startup instrumentation.

The reports include raw measurements, within-host effects, and confidence
intervals that resample hosts and paired blocks. Only three hosts limit the
evidence for host variation. These runs improve the match to the historical
issue's build and timing methodology, but October revisions and hosted hardware
differ from the original August benchmark.

The pinned local packaging task incorrectly applies the app-level standalone
Copilot CLI exclusion to the built-in extension, then requires that extension
SDK in its ripgrep materialization step. `build/prepare.py` preserves only the
extension-owned SDK and its package metadata in that dependency stream. The
app-level filters and product source remain unchanged. All variants use this
same packaging repair.
