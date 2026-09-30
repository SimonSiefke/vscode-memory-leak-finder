import type { Dynamic } from '../Types/Types.ts'
import { selectEvents, location, unionDuration, type TraceEvent } from '../PerformanceTraceEvents/PerformanceTraceEvents.ts'
export const analyze = (capture: Dynamic) => {
  const selected = selectEvents(capture)
  if (!selected.available) return { ...selected, metrics: {}, rows: [] }

  const jsNames = new Set([
    'FunctionCall',
    'EvaluateScript',
    'EvaluateModule',
    'RunMicrotasks',
    'EventDispatch',
    'V8.Execute',
    'v8.evaluateModule',
  ])
  const stack: TraceEvent[] = []
  const layouts: TraceEvent[] = [],
    styles: TraceEvent[] = []
  const rows = new Map<string, any>()
  for (const event of selected.events) {
    while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= event.ts) stack.pop()
    const parent = stack.findLast((parent) => parent.ts <= event.ts && parent.ts + parent.dur >= event.ts + event.dur)
    if (parent && (event.name === 'Layout' || event.name === 'UpdateLayoutTree' || event.name === 'RecalculateStyles')) {
      const isLayout = event.name === 'Layout'
      ;(isLayout ? layouts : styles).push(event)
      const name = `${isLayout ? 'layout' : 'style'} ${location(event) === '<unattributed>' ? location(parent) : location(event)}`
      const row = rows.get(name) || { name, count: 0, durationMs: 0 }
      row.count++
      row.durationMs += event.dur / 1000
      rows.set(name, row)
    }
    if (jsNames.has(event.name) || /^(?:v8|V8)[.]/.test(event.name)) stack.push(event)
  }
  return {
    ...selected,
    metrics: {
      forcedLayoutCount: layouts.length,
      forcedLayoutDurationMs: unionDuration(layouts),
      maxForcedLayoutDurationMs: layouts.reduce((max, event) => Math.max(max, event.dur / 1000), 0),
      forcedStyleCount: styles.length,
      forcedStyleDurationMs: unionDuration(styles),
    },
    rows: [...rows.values()].sort((a, b) => b.durationMs - a.durationMs),
  }
}
