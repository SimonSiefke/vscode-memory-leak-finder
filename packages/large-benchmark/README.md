# Large Benchmark

Compare two minified Linux x64 VS Code builds with paired startup, interaction,
resource, trace, profiling, memory, and bundle-size measurements. The package owns
the benchmark manifest, deterministic fixtures, collectors, result format, and
offline comparison report.

## Large Performance Measure

Run the [Large Performance Measure workflow](../../.github/workflows/large-performance.yml) from GitHub Actions
with `before_commit` and `after_commit` set to full VS Code commit SHAs. The manual workflow builds both
minified Linux x64 packages once, then runs 104 runtime benchmark jobs and a
JavaScript bundle-size comparison. It leaves the existing CI and bot workflows
unchanged.

The defaults are 37 samples per commit, all extensions disabled, and the entire
suite. CPU profiles and heap snapshots use at most five samples per commit.
Each job measures both revisions on the same runner and alternates their order.
Failures and unavailable facilities are recorded independently; regressions do
not fail the workflow. The final job always gathers the available evidence and
uploads **large-performance-report**. Download and extract it, then open
`index.html`. The report works offline and includes SVG charts, distributions,
coverage, JSON/CSV summaries, CPU flame charts, and links to raw evidence.

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

The report compares complete sample pairs only. Counts and byte sizes use means;
timings use medians. It also shows p95, standard deviation, min/max, and
deterministic paired-bootstrap 95% confidence intervals. Small samples and
intervals crossing zero are marked inconclusive. These intervals are exploratory
across many metrics, without a multiple-comparison significance claim. No
outliers are removed or samples silently retried.

Use the optional `samples` and `benchmark_filter` dispatch inputs for smaller
runs. Filters accept comma-separated exact IDs from the shared manifest, for
example:

```text
startup-empty-cold-timing,startup-empty-warm-timing,open-small-timing,bundles
```

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

# Create the expected-run manifest (also prints the complete matrix without a filter).
npm run matrix -- --before-commit BEFORE_SHA --after-commit AFTER_SHA \
  --samples 5 --benchmark-filter open-small-timing --output-dir .tmp/large-manifest

# Each measure command runs both revisions and checkpoints each sample.
xvfb-run --auto-servernum --server-args='-screen 0 1440x1000x24' \
  npm run measure -- --benchmark-id open-small-timing --samples 5 \
  --before-commit BEFORE_SHA --after-commit AFTER_SHA \
  --before-path .tmp/large-before/VSCode-linux-x64/code-oss \
  --after-path .tmp/large-after/VSCode-linux-x64/code-oss \
  --output-dir .tmp/large-results/open-small-timing

npm run report -- --manifest .tmp/large-manifest/manifest.json \
  --input-dir .tmp/large-results --output-dir .tmp/large-report
```

Replace `BEFORE_SHA` and `AFTER_SHA` with full 40-character hashes. Measurement
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
