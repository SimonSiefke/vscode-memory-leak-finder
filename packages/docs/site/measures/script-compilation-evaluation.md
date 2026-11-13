# script-compilation-evaluation

Run an existing scenario with `--check-leaks --measure-after --measure script-compilation-evaluation`. The diagnostic returns `isLeak: false`; it does not impose a performance threshold.

Measures recognized V8 compilation and script/module evaluation timeline events on the selected renderer main thread. Aggregates by available source location. Background compilation is excluded; compilation and evaluation can overlap. Captures at most 250,000 events; data loss is marked incomplete. Missing renderer markers are unavailable. Trace completion has a 10-second timeout and listeners are cleaned on failure. Run separately from other tracing measures.

JSON results retain numeric metrics and ranked rows. `npm run build-charts` generates separate count and duration charts with run labels. Instrumented elapsed times include observation overhead; compare equivalent scenarios using the same instrumentation. These measures start when the scenario measurement starts, not at process launch.
