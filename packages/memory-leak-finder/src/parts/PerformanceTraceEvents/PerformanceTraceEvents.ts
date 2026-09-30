import type { Dynamic } from '../Types/Types.ts'
export interface TraceEvent {
  name: string
  ts: number
  dur: number
  pid: number
  tid: number
  args?: Dynamic
}
export const selectEvents = (capture: Dynamic): { available: boolean; incomplete: boolean; events: TraceEvent[]; reason?: string } => {
  const input: Dynamic[] = Array.isArray(capture.events) ? capture.events : []
  const start = input.find((event) => event.name === 'TimeStamp' && event.args?.data?.message === capture.marker + ':start')
  const end = input.find(
    (event) =>
      event.name === 'TimeStamp' &&
      event.args?.data?.message === capture.marker + ':end' &&
      event.pid === start?.pid &&
      event.tid === start?.tid,
  )
  if (!start || !end) return { available: false, incomplete: true, events: [], reason: 'Selected renderer trace markers are missing' }
  const stack: Dynamic[] = []
  const events: TraceEvent[] = []
  let incomplete = capture.incomplete === true
  const append = (event: Dynamic) => {
    if (!Number.isFinite(event.ts) || !Number.isFinite(event.dur) || event.dur < 0) {
      incomplete = true
      return
    }
    if (event.ts >= start.ts && event.ts + event.dur <= end.ts) events.push(event)
  }
  for (const event of input.filter((event) => event.pid === start.pid && event.tid === start.tid).sort((a, b) => a.ts - b.ts)) {
    if (event.ph === 'X') append(event)
    else if (event.ph === 'B') stack.push(event)
    else if (event.ph === 'E') {
      const begin = stack.pop()
      if (begin) append({ ...begin, args: { ...begin.args, ...event.args }, dur: event.ts - begin.ts })
      else if (event.ts >= start.ts && event.ts <= end.ts) incomplete = true
    }
  }
  if (stack.some((event) => event.ts >= start.ts && event.ts <= end.ts)) incomplete = true
  return { available: true, incomplete, events: events.sort((a, b) => a.ts - b.ts || b.dur - a.dur) }
}
export const location = (event: TraceEvent): string => {
  const data = event.args?.data || event.args?.beginData || {}
  const frame = data.stackTrace?.[0] || data
  return frame.url ? `${frame.url}:${frame.lineNumber ?? 1}:${frame.columnNumber ?? 1}` : '<unattributed>'
}
export const unionDuration = (events: readonly TraceEvent[]): number => {
  let total = 0,
    end = -Infinity
  for (const event of [...events].sort((a, b) => a.ts - b.ts)) {
    const next = event.ts + event.dur
    total += Math.max(0, next - Math.max(end, event.ts))
    end = Math.max(end, next)
  }
  return total / 1000
}
