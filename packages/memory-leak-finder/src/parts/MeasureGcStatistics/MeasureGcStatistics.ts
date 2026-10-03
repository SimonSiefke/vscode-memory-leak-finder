import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import * as ForceGarbageCollection from '../ForceGarbageCollection/ForceGarbageCollection.ts'
import * as GcStatistics from '../GcStatistics/GcStatistics.ts'
import * as GetHeapUsage from '../GetHeapUsage/GetHeapUsage.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import { DevtoolsProtocolTracing } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

interface TraceState {
  complete: Promise<void>
  dataLossOccurred: boolean
  dispose: () => void
  events: Dynamic[]
}

export const id = MeasureId.GcStatistics

export const targets = [TargetId.Browser]

const emptyTraceState = (): TraceState => {
  return {
    complete: Promise.resolve(),
    dataLossOccurred: false,
    dispose() {},
    events: [],
  }
}

const removeListener = (session: Dynamic, event: string, listener: Dynamic): void => {
  if (typeof session.off === 'function') {
    session.off(event, listener)
  }
  if (session.listeners?.[event] === listener) {
    delete session.listeners[event]
  }
}

const addListener = (session: Session, event: string, listener: Dynamic): void => {
  if (typeof session.on !== 'function') {
    throw new Error(`GC statistics require a session with event listener support`)
  }
  session.on(event, listener)
}

const createTraceState = (session: Session): TraceState => {
  const events: Dynamic[] = []
  const { promise, resolve } = Promise.withResolvers<void>()
  let disposed = false
  const state: TraceState = {
    complete: promise,
    dataLossOccurred: false,
    dispose: cleanup,
    events,
  }
  function cleanup(): void {
    if (disposed) {
      return
    }
    disposed = true
    removeListener(session, DevtoolsEventType.TracingDataCollected, handleDataCollected)
    removeListener(session, DevtoolsEventType.TracingTracingComplete, handleTracingComplete)
  }
  function handleDataCollected(message: Dynamic): void {
    const value = message?.params?.value
    if (Array.isArray(value)) {
      events.push(...value)
    }
  }
  function handleTracingComplete(message: Dynamic): void {
    state.dataLossOccurred = message?.params?.dataLossOccurred === true
    cleanup()
    resolve()
  }
  addListener(session, DevtoolsEventType.TracingDataCollected, handleDataCollected)
  addListener(session, DevtoolsEventType.TracingTracingComplete, handleTracingComplete)
  return state
}

const getTraceOptions = () => {
  return {
    transferMode: 'ReportEvents',
    traceConfig: {
      includedCategories: ['v8'],
      recordMode: 'recordUntilFull',
    },
  }
}

const getFinalHeapStatistics = async (session: Session): Promise<{ readonly garbageBytes: number; readonly usedHeapBytes: number }> => {
  const before = await GetHeapUsage.getHeapUsage(session)
  await ForceGarbageCollection.forceGarbageCollection(session)
  const after = await GetHeapUsage.getHeapUsage(session)
  return {
    garbageBytes: before.usedSize - after.usedSize,
    usedHeapBytes: after.usedSize,
  }
}

export const create = (session: Session) => {
  const state = {
    trace: emptyTraceState(),
  }
  return [session, state]
}

export const start = async (session: Session, state: { trace: TraceState }) => {
  state.trace = createTraceState(session)
  await DevtoolsProtocolTracing.start(session, getTraceOptions())
  return {
    dataLossOccurred: false,
    metrics: GcStatistics.getGcStatistics([], 0, 0),
    rawEvents: [],
  }
}

export const stop = async (session: Session, state: { trace: TraceState }) => {
  await DevtoolsProtocolTracing.end(session, {})
  await state.trace.complete
  const finalHeapStatistics = await getFinalHeapStatistics(session)
  return {
    dataLossOccurred: state.trace.dataLossOccurred,
    metrics: GcStatistics.getGcStatistics(state.trace.events, finalHeapStatistics.usedHeapBytes, finalHeapStatistics.garbageBytes),
    rawEvents: state.trace.events,
  }
}

export const releaseResources = async (_session: Session, state: { trace: TraceState }) => {
  state.trace.dispose()
}

export const compare = (before: Dynamic, after: Dynamic) => {
  const metrics = after.metrics
  const rows = GcStatistics.toGcStatisticsRows(metrics)
  return {
    isLeak: false,
    metrics,
    raw: {
      after,
      before,
    },
    rows,
  }
}

export const isLeak = () => {
  return false
}

export const summary = ({ rows }: Dynamic) => {
  return GcStatistics.formatGcStatisticsSummary(rows || [])
}
