# module-resolution-lookups

Run an existing scenario with `--check-leaks --measure-after --measure-node --measure module-resolution-lookups`. The diagnostic returns `isLeak: false`; it does not impose a performance threshold.

Wraps the runtime `internalModuleStat` binding and verifies that a real CommonJS resolution reaches it before measuring. Reports file/directory/missing outcomes, paths and time, with separate ASAR-path counts. These are internal stat requests, not physical disk reads or archive cache misses. Package metadata reads and ESM-native probes are outside coverage. Unsupported runtimes return unavailable rather than zero; private binding compatibility is checked on each run.

JSON results retain numeric metrics and ranked rows. `npm run build-charts` generates separate count and duration charts with run labels. Instrumented elapsed times include observation overhead; compare equivalent scenarios using the same instrumentation. These measures start when the scenario measurement starts, not at process launch.
