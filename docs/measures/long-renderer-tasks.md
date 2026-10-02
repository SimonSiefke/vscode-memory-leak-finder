# long-renderer-tasks

Run an existing scenario with `--check-leaks --measure-after --measure long-renderer-tasks`. The diagnostic returns `isLeak: false`; it does not impose a performance threshold.

Counts complete outer renderer tasks over 50 ms and their duration, maximum task duration, and cumulative time exceeding 50 ms. This is a scenario diagnostic, not navigation Total Blocking Time. Boundary-crossing tasks are excluded. Captures at most 250,000 events; data loss is marked incomplete. Missing renderer markers are unavailable. Trace completion has a 10-second timeout and listeners are cleaned on failure. Run separately from other tracing measures.

JSON results retain numeric metrics and ranked rows. `npm run build-charts` generates separate count and duration charts with run labels. Instrumented elapsed times include observation overhead; compare equivalent scenarios using the same instrumentation. These measures start when the scenario measurement starts, not at process launch.
