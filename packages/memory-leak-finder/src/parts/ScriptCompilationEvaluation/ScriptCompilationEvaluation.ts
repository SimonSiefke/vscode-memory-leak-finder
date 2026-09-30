import { location, selectEvents, type TraceEvent, unionDuration } from '../PerformanceTraceEvents/PerformanceTraceEvents.ts'
import type { Dynamic } from '../Types/Types.ts'
export const analyze = (capture: Dynamic) => {
  const selected = selectEvents(capture)
  if (!selected.available) return { ...selected, metrics: {}, rows: [] }

  const compileNames = new Set([
    'V8.CompileScript',
    'V8.CompileCode',
    'V8.CompileModule',
    'v8.compile',
    'v8.compileModule',
    'v8.parseOnBackground',
  ])
  const evaluationNames = new Set(['EvaluateScript', 'EvaluateModule', 'v8.evaluateModule'])
  const compile = selected.events.filter((event) => compileNames.has(event.name))
  const evaluation = selected.events.filter((event) => evaluationNames.has(event.name))
  const rows = new Map<string, any>()
  for (const [kind, events] of [
    ['compile', compile],
    ['evaluate', evaluation],
  ] as const) {
    const bySource = new Map<string, TraceEvent[]>()
    for (const event of events) {
      const name = `${kind} ${location(event)}`
      const group = bySource.get(name) || []
      group.push(event)
      bySource.set(name, group)
    }
    for (const [name, group] of bySource) rows.set(name, { name, count: group.length, durationMs: unionDuration(group) })
  }
  return {
    ...selected,
    metrics: {
      compileEventCount: compile.length,
      compileDurationMs: unionDuration(compile),
      evaluationEventCount: evaluation.length,
      evaluationDurationMs: unionDuration(evaluation),
    },
    rows: [...rows.values()].sort((a, b) => b.durationMs - a.durationMs),
    coverage:
      'Recognized V8 compilation and script/module evaluation events on the selected renderer main thread; overlapping time within each category is counted once. Background compilation is outside coverage. Compilation and evaluation may overlap and must not be added.',
  }
}
