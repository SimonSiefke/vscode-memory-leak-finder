# module-resolution

Run an existing scenario with `--check-leaks --measure-after --measure-node --measure module-resolution`. The diagnostic returns `isLeak: false`; it does not impose a performance threshold.

Counts observed resolver invocations by `[specifier, parent]`, failures and inclusive/exclusive time. Uses synchronous Node resolve hooks when available, with a CommonJS-only fallback. Cache fast paths may bypass the resolver; repeated requests are not labelled cache misses. Each row is a unique observed pair; row counts identify repeats. Storage is bounded to 1,000 pairs, with overflow counted. Resolution duration excludes later module evaluation.

JSON results retain numeric metrics and ranked rows. `npm run build-charts` generates separate count and duration charts with run labels. Instrumented elapsed times include observation overhead; compare equivalent scenarios using the same instrumentation. These measures start when the scenario measurement starts, not at process launch.
