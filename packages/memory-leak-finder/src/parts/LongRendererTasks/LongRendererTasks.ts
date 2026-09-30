import { selectEvents, type TraceEvent, unionDuration } from '../PerformanceTraceEvents/PerformanceTraceEvents.ts'
import type { Dynamic } from '../Types/Types.ts'
export const analyze = (capture: Dynamic) => {
  const selected = selectEvents(capture)
  if (!selected.available) return { ...selected, metrics: {}, rows: [] }

  const tasks = selected.events.filter((event) => ['RunTask', 'ThreadControllerImpl::RunTask', 'ThreadPool_RunTask'].includes(event.name))
  const outer: TraceEvent[] = []
  let end = -Infinity
  for (const task of tasks) {
    if (task.ts < end) continue
    outer.push(task)
    end = task.ts + task.dur
  }
  const long = outer.filter((task) => task.dur > 50000)
  return {
    ...selected,
    metrics: {
      taskCount: outer.length,
      longTaskCount: long.length,
      longTaskDurationMs: unionDuration(long),
      blockingDurationMs: long.reduce((sum, event) => sum + event.dur / 1000 - 50, 0),
      maxTaskDurationMs: outer.reduce((max, event) => Math.max(max, event.dur / 1000), 0),
    },
    rows: long.map((event, index) => ({
      name: `task ${index + 1} @ ${(event.ts / 1000).toFixed(3)} ms`,
      count: 1,
      durationMs: event.dur / 1000,
    })),
    coverage:
      'Complete outer renderer tasks inside the marked interval; blocking duration is sum(max(task duration - 50 ms, 0)), not navigation TBT',
  }
}
