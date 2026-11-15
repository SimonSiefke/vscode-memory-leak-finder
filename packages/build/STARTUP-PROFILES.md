# Startup CPU profiles

Run on Linux with the Electron executable from a released VS Code installation (not the `bin/code` CLI wrapper). A headless runner needs Xvfb:

```sh
xvfb-run --auto-servernum node packages/build/src/measureStartupProfiles.ts \
  --executable /path/to/VSCode-linux-x64/code \
  --output .vscode-memory-leak-finder-results/startup-performance \
  --samples 7
node packages/charts/src/main.ts
```

The output directory must not exist. Use `--samples 17` for a larger population. The collector launches sequentially with fresh user data, a fresh shared directory, no third-party extensions and an empty window. Built-in extensions remain enabled. OS filesystem caches are not cleared, so these are not cold-machine measurements. The manifest records the executable, product version/commit, machine, sample count, attachment offsets and capture failures. Raw `.cpuprofile` files, the manifest, representative flame charts and CSV stack statistics are published under `startup-performance/`.

Main, shared process and extension host pause at their inspector entry point. Profiling starts before `Runtime.runIfWaitingForDebugger` resumes them. Renderer profiling starts as soon as the workbench DevTools target is discoverable; work before attachment can be missed. The stop condition is VS Code's native startup-profiler marker deletion (`--prof-startup-prefix`), emitted after `LifecyclePhase.Eventually` and installed-extension registration. The harness creates the marker before launch and stops the profilers after the renderer deletes it, then closes its own application. This includes background/idle work and sampling overhead, rather than measuring uninstrumented time to first paint. A 90-second launch deadline prevents a missing inspector from hanging a run indefinitely. Collection errors are recorded and cause a failing command; no missing capture becomes zero.

Aggregation matches full parent stacks by function name, URL, line and column, excluding run-local script/node IDs. Self-time is the sum of sample intervals for a leaf stack. Real V8 profiles can contain small negative timestamp deltas; reconstructing cumulative timestamps and making them monotonic gives nonnegative intervals without adding the clock backstep to total sampled time. The report discloses affected captures, and the raw profiles remain unchanged. Each stack gets a mean and median across valid process captures; an absent stack in a valid capture contributes zero. Missing or invalid profiles are excluded and disclosed. The flame chart is the actual run whose sampling-window duration is closest to the median (ties use the lower run index). It is not an averaged chronology.

Main CI collects seven launches on Ubuntu using VS Code 1.146.0, then the charts job downloads these artifacts into the merged results before Pages generation. The PR Ubuntu job exercises one launch and report generation. macOS and Windows run the portable aggregation/report/inspector tests, but do not collect startup profiles.
