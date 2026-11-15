# event-loop-delay

Run an existing scenario with `--check-leaks --measure-after --measure-node --measure event-loop-delay`. The diagnostic returns `isLeak: false`; it does not impose a performance threshold.

Uses Node perf_hooks with 10 ms resolution. Reports active/idle time, utilization ratio and delay mean/p95/max. Unsampled delays are null, not zero. Event-loop utilization is not CPU utilization. Covers the selected Node process after installation; early boot stalls cannot be inferred.

JSON results retain numeric metrics and ranked rows. `npm run build-charts` generates separate count and duration charts with run labels. Instrumented elapsed times include observation overhead; compare equivalent scenarios using the same instrumentation. These measures start when the scenario measurement starts, not at process launch.
