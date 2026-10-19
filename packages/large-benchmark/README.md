# Large Benchmark

Compare two or more minified Linux x64 VS Code builds with paired startup, interaction,
resource, trace, profiling, memory, and bundle-size measurements. The package owns
the benchmark manifest, paired orchestration, result format, and offline report.
It uses the existing DevTools connection and page-object harness, E2E scenarios
in `packages/e2e/src/performance-*.ts`, and measures in `packages/memory-leak-finder`.

Source modules follow `src/parts/ModuleName/ModuleName.ts`. The `src/main.ts`
entry point delegates to `parts/Main/Main.ts`; the other parts handle options,
the manifest, build preparation, measurements, bundle sizes, statistics, and reports.

## Large Performance Measure

Run the [Large Performance Measure workflow](../../.github/workflows/large-performance.yml) from GitHub Actions
with one of these revision inputs:

- `version_range`: an inclusive stable version range such as `1.120.0...1.130.0`.
  The workflow discovers published stable releases using Microsoft's
  [stable release API](https://update.code.visualstudio.com/api/releases/stable?released=true),
  includes patch releases within the bounds, sorts by numeric version, and resolves
  each Linux x64 release to its full commit SHA. Both endpoints must be published
  stable releases, and the range must select 2–256 versions. Insiders and prereleases
  are excluded. Resolution happens once during initialization; the manifest preserves
  each version and its commit, and the trend report displays version labels.
- `commits`: a JSON array of 2–256 unique full VS Code commit SHAs in version order
  (oldest to newest), for example `["<40-character SHA>", "<40-character SHA>", "<40-character SHA>"]`.
  The workflow preserves the supplied order rather than sorting hashes.
- `before_commit` and `after_commit`: the original two-build comparison.

All explicit commit inputs accept either a full 40-character SHA (from
`microsoft/vscode`) or `owner/vscode@<full 40-character SHA>`. For a fork PR,
set `before_commit` to `microsoft/vscode@<base SHA>` and `after_commit` to
`SimonSiefke/vscode@<PR head SHA>`. Qualified references also work in the
`commits` array and in local `--commit`, `--before-commit`, and `--after-commit`
options. Repository names and hashes are case insensitive. Use the same reference
when preparing, extracting, and measuring a build; metadata and reports preserve
the repository identity. Branch names, PR numbers, and abbreviated hashes are not
accepted.

These input modes cannot be combined. For example, set `version_range` to
`1.120.0...1.130.0`, set `measures` to `startup-times`, and leave all commit inputs empty.
An unavailable release API, unknown endpoint, missing Linux build, or invalid
commit metadata fails initialization before any builds start.

The workflow builds each minified Linux x64 package once and compares each adjacent
pair of commits. The full suite has 108 paired runtime benchmarks, one smoke-test timing benchmark, and one JavaScript
bundle-size benchmark per pair. Each matrix stays within 256 jobs by grouping
benchmarks into a job when necessary; each job downloads only its two required
builds. If a build fails, comparisons using other builds can still run. Build and
measurement failures for individual versions are informational: the workflow
succeeds when at least one adjacent comparison has usable results. Missing
comparisons remain visible in the report and Actions summary. A run with no
usable comparisons still fails after preserving the report. It leaves the
existing CI and bot workflows unchanged.

The defaults are 37 samples per commit **per adjacent comparison**, all extensions disabled, and the entire
suite. Interior commits are measured again against their next neighbor. CPU profiles, heap snapshots, and CSS selector traces use at most five samples per commit.
Each paired runtime job measures both revisions on the same runner and alternates their order. Smoke tests use separate per-commit jobs as described below.
Failures and unavailable facilities are recorded independently; regressions do
not fail the workflow. The final job always gathers the available evidence and
uploads **large-performance-report**. Download and extract it, then open
`index.html`. The report works offline and includes SVG charts, distributions,
coverage, and CPU flame charts. This artifact contains only the HTML report and
SVG charts. Raw JSON data, traces, profiles, snapshots, and diagnostics remain in
the separate **large-result-pair-&lt;pair-number&gt;-&lt;group-number&gt;** artifacts; the report identifies
the corresponding artifact for each benchmark without copying its evidence.

For commit arrays, the report opens with a trend chart per metric and a table of
changes between adjacent commits, including improvements, regressions, complete
pair counts, and confidence intervals. Links open the full paired report for each
step. The Actions summary shows overall chained changes and available links.

Trend charts start at an index of 100 and multiply adjacent after/before ratios.
This uses comparisons measured on the same runner rather than comparing absolute
timings across runners. The overall percentage describes cumulative relative
change; it is not an absolute startup time or a direct first-to-last measurement.
Uncertainty can accumulate across links, and there is no aggregate confidence
interval. Missing metrics and zero baselines separate the plotted ranges. Each
uninterrupted measured range restarts at 100, with no line across a gap; index
levels from different ranges cannot be compared. The overall change is unavailable
unless all adjacent links are valid. Input order defines chart spacing, not elapsed
calendar time.

The original before/after inputs retain the paired report and Actions summary:
tables for every available metric, grouped by collector, with before/after values,
absolute and percentage changes, complete pair counts, and paired confidence
intervals. Benchmark coverage remains available in each pair report, including
failed and unavailable collectors.

Startup covers an empty window and a workspace opening a fixed text file, in
both cold and warm conditions. Cold launches use fresh profiles and clear Linux
page, dentry, and inode caches immediately before spawning VS Code. Warm launches
prime a separate profile with one unmeasured launch before each measured launch,
preserving that profile and OS caches. Shared application storage is isolated
inside each profile. Interactions cover opening small/large text files, typing,
scrolling, find, workspace search, Quick Open, Explorer expansion, diff, terminal
creation/commands, and Settings.

Collectors run separately: timings, hardware instruction/cycle counters,
software CPU counters and sampled process-tree PSS, renderer performance
counters, Chromium timeline traces, CPU profiles, and renderer heap/code bytes.
Startup traces use VS Code's early tracing hook before the Chromium workbench
renderer launches, and are clipped at readiness; action
traces exclude setup and cleanup. Timings measure input dispatch through visible
completion, including automation polling. PSS samples are taken every 250 ms and
can miss brief peaks. Heap/code values describe renderer snapshot self-size;
V8 code nodes include bytecode and code metadata. Missing hardware counters and
trace categories are never reported as zero.

The interaction scenarios use the same page APIs and setup/run/teardown stages
as other E2E scenarios. Their `run` function ends at visible completion, with
cleanup in `teardown` after collection stops. The existing leak scenarios often
open and close a view in a single run; these dedicated workloads separate those
actions to measure opening alone. They are opt-in (`skip = true`) for ordinary
E2E runs and can also be executed with the harness's `--run-skipped-tests-anyway`.
New reusable measures are `performanceTimeline`, `heapSnapshotBytes`,
`processTreeCpuCounters`, and `processTreePss`. Profiling, renderer counter
normalization, heap snapshot streaming, and PID-validated PSS sampling reuse
the existing implementations. Cold/warm launch preparation and startup tracing
remain orchestration hooks so collection begins before workbench initialization.

The report compares complete sample pairs only. Counts and byte sizes use means;
timings use medians. It also shows p95, standard deviation, min/max, and
deterministic paired-bootstrap 95% confidence intervals. Small samples and
intervals crossing zero are marked inconclusive. These intervals are exploratory
across many metrics, without a multiple-comparison significance claim. No
outliers are removed or samples silently retried.

Use the optional `measures` dispatch input to select comma-separated groups:

| Group                                                                                         | Benchmarks                                                                    |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `smoke`                                                                                       | Electron smoke suite wall time; independent job per commit                    |
| `startup-times`                                                                               | Only empty-window and workspace startup timings, cold and warm (4 benchmarks) |
| `startup`                                                                                     | All startup collectors (24 benchmarks)                                        |
| `timing`, `instructions`, `resources`, `renderer`, `timeline`, `profile`, `memory`, `bundles` | Benchmarks using the selected collectors                                      |

`css-selectors` selects CSS selector startup statistics (4 diagnostic benchmarks).

Multiple groups are combined. Empty `measures` selects all measures. The existing
`benchmark_filter` further restricts the selection to comma-separated exact IDs;
unknown groups/IDs and an empty intersection are rejected. For example:

```text
startup-empty-cold-timing,startup-empty-warm-timing,open-small-timing,bundles
```

To compare startup performance across the last 100 stable VS Code versions,
pass the oldest and newest desired stable version as `version_range`, or supply
the 100 corresponding commit SHAs in release order, and set `measures` to `startup-times`. This builds 100 versions and measures 99 adjacent
comparisons across the four startup workloads (396 benchmark comparisons, grouped
into 198 measurement jobs). Use `samples` to control repetition. The workflow
automatically resolves version ranges; raw commit arrays remain available for
custom histories. Historical commits must build with
the existing build pipeline and run with the current harness. Unsupported or failed
builds/measurements remain visible as gaps instead of fabricated trend values.
Large runs that select all collectors group more benchmarks into each job and may
reach the job time limit; prefer focused measures for long histories.

## Function counts over time video

Run the [Large Performance Over Time workflow](../../.github/workflows/large-performance-over-time.yml)
for a video of the existing renderer **function-count** chart across VS Code releases.
The defaults are the latest **20 published stable releases** (including patches), in
oldest-to-newest order, and **400 ms per frame**. Alternatively supply an inclusive
`version_range`; it takes precedence over `last_versions`. `frame_duration_ms`
controls playback speed (40–60000 ms).

This runs the same default E2E suite and `--check-leaks --measure-after --measure function-count`
arguments as the ordinary function-count CI job, using the same current harness
checkout for every version. Each version is built and measured once, independently
of adjacent versions. It does not run the paired performance collectors or repeat
the suite 37 times. The suite uses one running application, without restarting
between tests, so counts describe the retained functions after each scenario.

Download **large-performance-over-time** and open `index.html` or play
`function-count-history.mp4`. The 1280×720 H.264 video has the VS Code version at
the top right of every frame. All frames use the same zero-based count scale and
alphabetical test order. SVG and PNG frames are retained in `frames/`, and
`test-order.json` maps chart indexes to test names. Twenty usable frames make an
eight-second video at the default speed; the HTML player supports looping.

Build failures and versions without matching test inventories are omitted from
playback and listed in `coverage.json` and the HTML report. The largest collected
inventory defines the shared test order; only exact matches enter the video.
A nonzero harness exit excludes that version; partial counts and the failure
diagnostic are retained. Missing/invalid counts are never replaced with zero. A run with no usable frames fails after saving coverage. A single usable
version still produces a video. Raw per-test data is available in each
**large-history-result-&lt;commit-artifact&gt;** artifact. Historical builds must
support the current harness, and comparisons may reflect application changes as
well as changes in scenario behavior. This workflow does not change the existing
Large Performance Measure workflow.

Local commands (from the repository root, after installing/building the harness):

```sh
npm run large-performance -- history-matrix --last-versions 20 --output-dir .tmp/history
# Or: history-matrix --version-range 1.100.0...1.110.0 --frame-duration-ms 400

# For each release in manifest.json, prepare/extract its build using the existing
# prepare/extract commands, then run serially in this checkout:
xvfb-run --auto-servernum --server-args='-screen 0 1440x1000x24' \
  npm run large-performance -- history-measure \
  --commit FULL_SHA --vscode-version 1.100.0 --build-path /absolute/path/to/code-oss \
  --output-dir .tmp/history-results/1.100.0

npm run large-performance -- history-report --manifest .tmp/history/manifest.json \
  --input-dir .tmp/history-results --output-dir .tmp/history-report
```

Measurement jobs require the usual Linux x64 desktop dependencies. Report generation
requires FFmpeg with the `librsvg` decoder and `libx264` encoder, plus DejaVu fonts
(`sudo apt-get install ffmpeg fonts-dejavu-core` on Ubuntu). The workflow installs
them automatically. The report command also accepts result artifacts downloaded
into separate subdirectories. Each manifest commit must have at most one result.

## CSS selector comparisons

Set `measures` to `css-selectors` to build and compare CSS selector matching costs
at startup. This selects four separate diagnostic workloads: empty-window and
workspace startup, each cold and warm. It works with the same before/after commit
inputs, qualified fork references, ordered commit arrays, and inclusive stable
`version_range` inputs (for example `1.120.0...1.142.0`, once both endpoints are
published). Each build is reused across adjacent comparisons.

Each pair report includes two SVG charts per workload:

- **Totals:** elapsed selector matching time, match attempts, matches,
  fast rejects, invalidations (where supported), and recorded style recalculations. Each metric has its own scale;
  totals include all selectors, regardless of the detail limit.
- **Details:** at most 3,000 selectors, with two horizontal bars per selector
  (before and after elapsed matching time). Rows are ordered by the larger median
  on either revision, slowest first. The chart scrolls and can be opened separately;
  hover for the full selector text and exact values.

Collection starts through VS Code's early trace hook, before the workbench renderer
initializes, and ends at visible workbench readiness (including rendered text for
workspace startup). Only the workbench renderer's events before that boundary are
included. The instrumentation runs separately from ordinary timing collectors and
adds overhead; these numbers describe instrumented selector matching cost.

Identical selector text is combined across stylesheets because stylesheet IDs are
process-local. Every selector is retained in the raw results before ranking; the
3,000-row limit applies only to the rendered detail chart. Detail bars use the
median elapsed time from complete sample pairs. A selector absent from an otherwise
complete trace contributes zero; an unavailable or failed trace contributes no
pair. Added and removed selectors are included. Missing instrumentation, unsupported
trace formats, missing startup boundaries, and full/lost trace buffers are reported
as unavailable rather than zero. Raw traces and selector JSON remain in the result
artifacts. Version-range reports show total-metric trends and link to the two-chart
details for every adjacent version pair.

For a focused range comparison, use `version_range: 1.120.0...1.142.0` and
`measures: css-selectors`; use `benchmark_filter: startup-workspace-warm-css-selectors`
to restrict it to warm workspace startup. Historical versions must still build and
support selector tracing; unavailable releases remain visible as gaps.

## Smoke test timing comparisons

Set `measures` to `smoke` in **Large Performance Measure**, with `before_commit`
and `after_commit` set to full commit references. The exact benchmark ID is
`smoke-tests`. Smoke timing is also included when the entire suite is selected.
The default is 37 attempts per commit; `samples` overrides it.

For a two-commit comparison the workflow creates two build jobs, followed by two
smoke jobs (one per commit), and a final report job. Each smoke job downloads only
its packaged build and a shared compiled smoke harness. The first commit's build
job compiles the upstream Electron smoke suite and archives its installed
Node dependencies plus one pinned checkout of `microsoft/vscode-smoketest-express`.
Both revisions use this identical harness and fixture, whose commits are recorded
with every result. Series inputs run one smoke job per commit and reuse that
commit's results in the adjacent comparison reports; smoke results are separate
from the paired trend index. Historical builds must support the first commit's suite.

Each attempt launches a fresh Mocha process against the packaged Code OSS build,
using upstream smoke setup/cleanup to reset profiles, extensions, and the fixture
workspace. Compilation, installation, artifact extraction, and copying diagnostic
files are outside the timing window. The measured wall time includes process
startup, suite setup, tests, and cleanup. The OSS suite's usual product gates apply;
stable-version migration tests are skipped to avoid repeated stable-build downloads.
Automatic tracing is disabled for these timings. No outliers are removed, and
failed attempts are retained without retries. A run with no tests, failed tests, or retried tests is
rejected. Successful samples must have identical passed-test inventories and
pending-test counts before they can be compared.

The offline report and Actions summary show **both mean and median**, before/after
values in milliseconds, absolute/percentage changes, and successful/requested
counts for each commit. `charts/smoke-tests.svg` compares both statistics and labels
the commit identities. Raw `smoke-result.json`, per-attempt Mocha JSON, console
output (bounded to the last 4 MiB), logs, and crash evidence are retained in
`large-result-smoke-<commit-artifact>` artifacts. Interrupted jobs preserve their
last checkpoint; missing jobs or mismatched suites remain visible as unavailable
comparisons. Failed/missing attempts do not enter the successful-run statistics;
a comparison with failures is marked partial. This conditional subset can be
biased when failure rates differ, so inspect counts and diagnostics with timings.

These jobs run on independent GitHub-hosted runners. Their results are descriptive:
runner differences and external service variability can affect the observed change,
and 37 repetitions do not remove that bias. Smoke results have no paired confidence
interval or statistical significance label. An attempt times out after 20 minutes;
the overall job limit is 350 minutes, so slow suites may leave a partial checkpoint.

Local example (run from the repository root, after preparing both packaged builds):

```sh
node packages/large-benchmark/src/main.ts prepare-smoke \
  --commit BEFORE_SHA --output-dir "$PWD/.large-smoke"
# When moving the harness archive to another machine, verify and extract it:
node packages/large-benchmark/src/main.ts extract-smoke --input-dir .large-smoke

# Repeat this command for AFTER_SHA with its executable and another output directory.
xvfb-run --auto-servernum --server-args='-screen 0 1440x1000x24' \
  npm run large-performance:smoke -- \
  --commit BEFORE_SHA --build-path "$PWD/.large-before/VSCode-linux-x64/code-oss" \
  --harness-path "$PWD/.large-smoke" --samples 37 \
  --output-dir .large-results/smoke-before
```

Create a manifest with `--measures smoke` and generate the report using the normal
`matrix` and `report` commands. Local jobs require Linux x64, desktop libraries,
and Xvfb or a display. Extracting the archive is required even on the build machine.

## Local usage

Run commands from the package directory using Node from the repository's
[`.nvmrc`](../../.nvmrc):

```sh
cd packages/large-benchmark

# Build/archive each revision; uses the existing commit build pipeline.
npm run prepare-build -- --commit BEFORE_SHA --output-dir .tmp/large-before
npm run prepare-build -- --commit AFTER_SHA --output-dir .tmp/large-after

# A fork comparison uses qualified references throughout, for example:
# npm run prepare-build -- --commit SimonSiefke/vscode@FULL_SHA --output-dir .tmp/large-fork
# npm run matrix -- --before-commit microsoft/vscode@BASE_SHA \
#   --after-commit SimonSiefke/vscode@HEAD_SHA --measures startup-times

# Validate the checksums and extract the packaged executables.
npm run benchmark -- extract --commit BEFORE_SHA --input-dir .tmp/large-before
npm run benchmark -- extract --commit AFTER_SHA --input-dir .tmp/large-after

# Resolve all published stable releases in an inclusive range (including patches).
npm run matrix -- --version-range 1.120.0...1.130.0 \
  --measures startup-times --samples 5 --output-dir .tmp/large-series-manifest

# Or create a version-series manifest from explicit hashes.
npm run matrix -- --commits '["FIRST_SHA", "SECOND_SHA", "THIRD_SHA"]' \
  --measures startup-times --samples 5 --output-dir .tmp/large-series-manifest

# Or create the original two-build manifest.
npm run matrix -- --before-commit BEFORE_SHA --after-commit AFTER_SHA \
  --samples 5 --benchmark-filter open-small-timing --output-dir .tmp/large-manifest

# Each measure command runs one adjacent pair and checkpoints each sample.
# For a series, repeat with the commits/paths for each adjacent pair, saving
# results in separate subdirectories of .tmp/large-results.
xvfb-run --auto-servernum --server-args='-screen 0 1440x1000x24' \
  npm run measure -- --benchmark-id open-small-timing --samples 5 \
  --before-commit BEFORE_SHA --after-commit AFTER_SHA \
  --before-path .tmp/large-before/VSCode-linux-x64/code-oss \
  --after-path .tmp/large-after/VSCode-linux-x64/code-oss \
  --output-dir .tmp/large-results/open-small-timing

npm run report -- --manifest .tmp/large-manifest/manifest.json \
  --input-dir .tmp/large-results --output-dir .tmp/large-report

# For a series report, use the series manifest and all adjacent-pair results.
npm run report -- --manifest .tmp/large-series-manifest/manifest.json \
  --input-dir .tmp/large-results --output-dir .tmp/large-series-report
```

The `measure` command also accepts comma-separated benchmark IDs in
`--benchmark-id`; grouped results are written in benchmark subdirectories.

Replace all example SHAs with full 40-character hashes. Measurement
commands require Node from the repository's `.nvmrc`, Linux x64, Xvfb or a display,
and desktop libraries. Instruction/resource counters additionally need a working `perf`
installation and event permissions. Cold startup needs noninteractive permission
to write `/proc/sys/vm/drop_caches`. Unsupported collectors remain visible in the
report while other measurements continue. Raw traces and snapshots are gzip
compressed; decompress them before opening them in developer tools. Artifacts
are retained for 30 days.

Building commits uses the repository's existing CLI build pipeline. Measuring prebuilt executables
and generating reports run directly from this package. The root
`large-performance`, `large-performance:prepare`, `large-performance:measure`,
and `large-performance:report` commands remain available as shortcuts. Relative
paths resolve from the command's working directory; `npm --prefix` runs scripts
inside the package, so use absolute paths when referencing files elsewhere.

`prepare-build` is an explicit build command; installing the package does not
build VS Code. Tests run with `npm --prefix packages/large-benchmark test` and
type checks with `npm --prefix packages/large-benchmark run type-check`.
Install the monorepo with `npm ci` before measuring; the shared workers and page
objects use their package dependencies. `npm run build` builds the injected
scenario utilities, which the workflow prepares before running measurements.
