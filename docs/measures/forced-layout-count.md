# forced-layout-count

Run an existing scenario with `--check-leaks --measure-after --measure forced-layout-count`. The diagnostic returns `isLeak: false`; it does not impose a performance threshold.

Counts Layout and style recalculation events nested within JavaScript invocation events, without a duration threshold. Selects the renderer thread using trace markers. Duration uses interval unions to avoid double-counting nested events. Trigger locations use trace stacks or the enclosing invocation; missing locations remain unattributed. Captures at most 250,000 events; data loss is marked incomplete. Missing renderer markers are unavailable. Trace completion has a 10-second timeout and listeners are cleaned on failure. Run separately from other tracing measures.

JSON results retain numeric metrics and ranked rows. `npm run build-charts` generates separate count and duration charts with run labels. Instrumented elapsed times include observation overhead; compare equivalent scenarios using the same instrumentation. These measures start when the scenario measurement starts, not at process launch.
