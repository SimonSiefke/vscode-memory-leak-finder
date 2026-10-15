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
with `commits` set to a JSON array of full VS Code commit SHAs in version order
(oldest to newest), for example `["<40-character SHA>", "<40-character SHA>", "<40-character SHA>"]`.
Alternatively, keep using `before_commit` and `after_commit` for the original two-build report.
Supply either the array or the before/after inputs, not both. Arrays accept 2–256 unique commits;
the workflow preserves the supplied order rather than sorting hashes.

The workflow builds each minified Linux x64 package once and compares each adjacent
pair of commits. The full suite has 104 runtime benchmarks and one JavaScript
bundle-size benchmark per pair. Each matrix stays within 256 jobs by grouping
benchmarks into a job when necessary; each job downloads only its two required
builds. If a build fails, comparisons using other builds can still run. It leaves
the existing CI and bot workflows unchanged.

The defaults are 37 samples per commit **per adjacent comparison**, all extensions disabled, and the entire
suite. Interior commits are measured again against their next neighbor. CPU profiles and heap snapshots use at most five samples per commit.
Each job measures both revisions on the same runner and alternates their order.
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
interval. Missing metrics and zero baselines stop the cumulative index; later
valid pair results remain visible. Input order defines chart spacing, not elapsed
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
| `startup-times`                                                                               | Only empty-window and workspace startup timings, cold and warm (4 benchmarks) |
| `startup`                                                                                     | All startup collectors (20 benchmarks)                                        |
| `timing`, `instructions`, `resources`, `renderer`, `timeline`, `profile`, `memory`, `bundles` | Benchmarks using the selected collectors                                      |

Multiple groups are combined. Empty `measures` selects all measures. The existing
`benchmark_filter` further restricts the selection to comma-separated exact IDs;
unknown groups/IDs and an empty intersection are rejected. For example:

```text
startup-empty-cold-timing,startup-empty-warm-timing,open-small-timing,bundles
```

To compare startup performance across the last 100 stable VS Code versions,
supply the 100 corresponding commit SHAs in release order and set
`measures` to `startup-times`. This builds 100 versions and measures 99 adjacent
comparisons across the four startup workloads (396 benchmark comparisons, grouped
into 198 measurement jobs). Use `samples` to control repetition. The workflow
accepts commit hashes, so resolve release versions to their commits before dispatch;
it does not discover releases automatically. Historical commits must build with
the existing build pipeline and run with the current harness. Unsupported or failed
builds/measurements remain visible as gaps instead of fabricated trend values.
Large runs that select all collectors group more benchmarks into each job and may
reach the job time limit; prefer focused measures for long histories.

## Local usage

Run commands from the package directory using Node from the repository's
[`.nvmrc`](../../.nvmrc):

```sh
cd packages/large-benchmark

# Build/archive each revision; uses the existing commit build pipeline.
npm run prepare-build -- --commit BEFORE_SHA --output-dir .tmp/large-before
npm run prepare-build -- --commit AFTER_SHA --output-dir .tmp/large-after

# Validate the checksums and extract the packaged executables.
npm run benchmark -- extract --commit BEFORE_SHA --input-dir .tmp/large-before
npm run benchmark -- extract --commit AFTER_SHA --input-dir .tmp/large-after

# Create a version-series manifest and matrix (replace SHAs with full hashes).
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
