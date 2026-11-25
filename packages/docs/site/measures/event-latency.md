# event-latency

Run a scenario that sends trusted input with `--check-leaks --measure-after --measure event-latency`, for example `--only ^performance-type.ts --run-skipped-tests-anyway`. The diagnostic returns `isLeak: false`; it does not impose a performance threshold.

Uses an Event Timing `PerformanceObserver` (`type: 'event'`, `durationThreshold: 16`) in the workbench page, installed when measurement starts and not buffered, so earlier startup input is excluded. Before the snapshot it waits two animation frames (200 ms fallback) so the last interaction can paint.

Reports `slowEventCount`, `interactionCount`, duration p50/p95/max over all slow events, and p95/max of the longest entry per `interactionId`. `events` holds count and p50/p95/max duration per event name. `rows` are the 20 slowest entries, each split into `inputDelayMs` (start to handler), `processingMs` (handlers) and `presentationDelayMs` (handlers to next paint, clamped at 0). At most 5,000 entries are stored; extra entries are counted in `droppedEventCount` and the result is marked incomplete. When `performance.eventCounts` is available, `eventCounts` holds the per-type number of all dispatched events during the window (types without events are omitted) and `eventCount` their total; otherwise both are absent.

Limits: only events of at least 16 ms are reported, so counts are slow events, not all events. `duration` is rounded to 8 ms. Only trusted input is timed: CDP input such as `Editor.typeCharacters` is covered, while helpers that call `dispatchEvent` (`Editor.type`, `Locator.click`, `keyboard.press`) produce no entries. Webviews and iframes are not covered. Targets without Event Timing, such as Node processes, are reported as unavailable.

JSON results retain numeric metrics and ranked rows. Instrumented elapsed times include observation overhead; compare equivalent scenarios using the same instrumentation. These measures start when the scenario measurement starts, not at process launch.
