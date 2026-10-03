# synchronous-file-system

Run an existing scenario with `--check-leaks --measure-after --measure-node --measure synchronous-file-system`. The diagnostic returns `isLeak: false`; it does not impose a performance threshold.

Counts/times selected synchronous public `fs` APIs, grouped by API, path (or descriptor), and caller. Measures readFile/stat/lstat/fstat/readdir/readlink/realpath (including native)/access/exists/open/read/close. Preserves exceptions and return values. Captured references, ESM named bindings and Node internal loader I/O can bypass these exports. Nested operations have exclusive timing to avoid double-counting. Caller stacks add overhead; grouped rows are capped at 1,000.

JSON results retain numeric metrics and ranked rows. `npm run build-charts` generates separate count and duration charts with run labels. Instrumented elapsed times include observation overhead; compare equivalent scenarios using the same instrumentation. These measures start when the scenario measurement starts, not at process launch.
