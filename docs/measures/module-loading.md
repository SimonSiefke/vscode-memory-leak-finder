# module-loading

Run an existing scenario with `--check-leaks --measure-after --measure-node --measure module-loading`. The diagnostic returns `isLeak: false`; it does not impose a performance threshold.

Measures CommonJS `_load` requests, including cached requests, grouped by specifier and parent. Inclusive duration includes dependency loading; exclusive duration subtracts nested calls. Reports newly cached filenames present at stop. This does not claim to measure pure evaluation time, evicted modules, or ESM loading.

JSON results retain numeric metrics and ranked rows. `npm run build-charts` generates separate count and duration charts with run labels. Instrumented elapsed times include observation overhead; compare equivalent scenarios using the same instrumentation. These measures start when the scenario measurement starts, not at process launch.
