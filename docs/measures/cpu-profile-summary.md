# cpu-profile-summary

Run an existing scenario with `--check-leaks --measure-after --measure cpu-profile`. The diagnostic returns `isLeak: false`; it does not impose a performance threshold.

Extends `--measure cpu-profile`; no new capture mode. Reports sampled JavaScript (URL-attributed), idle, GC, and other/unattributed time, separately from profile elapsed time. These are sampling estimates, not invocation counts or operating-system CPU time. Missing or malformed time deltas use an explicitly marked uniform estimate. Source self-time resolves through existing source-map lookup, falling back to generated URLs. Existing raw profiles, function rankings, and flame charts are retained; an additional chart family presents the summaries.

JSON results retain numeric metrics and ranked rows. `npm run build-charts` generates separate count and duration charts with run labels. Instrumented elapsed times include observation overhead; compare equivalent scenarios using the same instrumentation. These measures start when the scenario measurement starts, not at process launch.
