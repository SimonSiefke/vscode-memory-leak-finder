import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { install } from '../EventLatencyTracker/EventLatencyTracker.ts'
import * as Diagnostic from '../RuntimePerformanceDiagnostic/RuntimePerformanceDiagnostic.ts'
import type { Session } from '../Session/Session.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import type { Dynamic } from '../Types/Types.ts'
export const id = 'eventLatency'
export const targets = [TargetId.Browser]
const key = '__memoryLeakFinderEventLatency'
// Event Timing entries are queued after the next paint, so let the last interaction present first.
const waitForPaint = async (session: Session) => {
  try {
    await DevtoolsProtocolRuntime.evaluate(session, {
      expression: `typeof requestAnimationFrame === 'function' ? new Promise((resolve) => {
        const timeout = setTimeout(resolve, 200);
        requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(timeout); resolve(undefined); }));
      }) : undefined`,
      awaitPromise: true,
      returnByValue: true,
    })
  } catch {
    // The snapshot below reports a lost execution context.
  }
}
export const create = Diagnostic.create
export const start = (session: Session) => Diagnostic.start(session, key, install)
export const stop = async (session: Session) => {
  await waitForPaint(session)
  return Diagnostic.stop(session, key)
}
export const releaseResources = (session: Session) => Diagnostic.release(session, key)
export const compare = Diagnostic.compare
export const isLeak = Diagnostic.isLeak
export const summary = (result: Dynamic): string => {
  if (result.available === false) return Diagnostic.summary(result)
  const lines = [Diagnostic.summary({ ...result, rows: [] })]
  if (!result.metrics?.slowEventCount)
    lines.push(
      `No events reached ${result.durationThresholdMs ?? 16} ms${result.eventCounts ? ` (${result.metrics?.eventCount ?? 0} events dispatched)` : ''}`,
    )
  for (const [name, event] of Object.entries<Dynamic>(result.events || {}))
    lines.push(
      `${name} | slow ${event.count}${result.eventCounts ? ` of ${result.eventCounts[name] ?? 0}` : ''} | p95 ms ${event.p95DurationMs}`,
    )
  const ms = (value: number) => Math.round(value * 10) / 10
  for (const row of (result.rows || []).slice(0, 5))
    lines.push(
      `${row.name} | ms ${row.durationMs} | input ${ms(row.inputDelayMs)} | processing ${ms(row.processingMs)} | presentation ${ms(row.presentationDelayMs)}`,
    )
  return lines.join('\n')
}
