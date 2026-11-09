# synchronous-dom-read-count-with-stack-traces

Run an existing scenario with `--check-leaks --measure-after --measure synchronous-dom-read-count-with-stack-traces`. The diagnostic returns `isLeak: false`; it does not impose a performance threshold.

Counts successful reads of covered geometry/style APIs in the selected browser realm. Covers HTMLElement offset geometry; Element client/scroll geometry; Element and Range rectangle methods; and getComputedStyle. Setters remain untouched. Reads can occur without triggering layout. Other frames, navigation to a new context, and previously captured method references are outside coverage. Captures caller stacks, bounded to 1,000 groups with overflow counts. Generated stacks remain available in JSON; source maps resolve captured locations where available.

JSON results retain numeric metrics and ranked rows. `npm run build-charts` generates separate count and duration charts with run labels. Instrumented elapsed times include observation overhead; compare equivalent scenarios using the same instrumentation. These measures start when the scenario measurement starts, not at process launch.
