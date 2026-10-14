import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import type { Metric } from '../PerformanceMetric/PerformanceMetric.ts'
import { evaluate } from '../ConnectDevtoolsEndpoint/ConnectDevtoolsEndpoint.ts'
import { createConnection } from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { electronExpression, stopTrace, traceCategories } from '../PerformanceCapture/PerformanceCapture.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

interface State {
  main?: Session
  path: string
  electronWebSocketUrl: string
  recording: boolean
}
export const id = MeasureId.PerformanceTimeline
export const targets = []
export const create = (session: Session & { electronWebSocketUrl: string }) =>
  [
    session,
    {
      path: join(tmpdir(), `performance-${randomUUID()}.json`),
      electronWebSocketUrl: session.electronWebSocketUrl,
      recording: false,
    } satisfies State,
  ] as const
export const start = async (session: Session, state: State) => {
  state.main = await createConnection(state.electronWebSocketUrl, { requestTimeoutMs: 120000 })
  await evaluate(
    state.main!,
    electronExpression(
      `await electron.contentTracing.startRecording({ categoryFilter: ${JSON.stringify(traceCategories)}, traceOptions: 'record-until-full' })`,
    ),
  )
  state.recording = true
  await evaluate(session, `console.timeStamp('large-start')`)
  return []
}
export const stop = async (session: Session, state: State) => {
  if (!state.main) throw new Error('Timeline was not started')
  await evaluate(session, `console.timeStamp('large-end')`)
  const metrics = await stopTrace(state.main, state.path, false)
  state.recording = false
  return metrics
}
export const releaseResources = async (_session: Session, state: State) => {
  try {
    if (state.main && state.recording)
      await evaluate(state.main, electronExpression(`await electron.contentTracing.stopRecording(${JSON.stringify(state.path)})`))
  } finally {
    await state.main?.dispose()
    await rm(state.path, { force: true })
  }
}
export const compare = (_before: unknown, after: Metric[]) => ({ isLeak: false, metrics: after })
export const isLeak = () => false
export const summary = ({ metrics }: { metrics: Metric[] }) => JSON.stringify(metrics)
