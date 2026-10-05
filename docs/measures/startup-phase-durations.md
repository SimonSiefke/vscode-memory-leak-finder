# startup-phase-durations

Run an existing scenario with `--check-leaks --measure-after --measure startup-phase-durations`. The diagnostic returns `isLeak: false`; it does not impose a performance threshold.

Reports new PerformanceMeasure entries (including contribution timings if the application records them) and retained code/* startup mark pairs: renderer-to-workbench, workbench initialization, and main-to-renderer when both marks exist in the same timeline. Existing marks allow inspection after startup without claiming launch instrumentation. Absent pairs are explicitly unavailable, repeated ends match the latest preceding start, and overlapping durations are not summed. Does not clear application marks or measures.

JSON results retain numeric metrics and ranked rows. `npm run build-charts` generates separate count and duration charts with run labels. Instrumented elapsed times include observation overhead; compare equivalent scenarios using the same instrumentation. These measures start when the scenario measurement starts, not at process launch.
