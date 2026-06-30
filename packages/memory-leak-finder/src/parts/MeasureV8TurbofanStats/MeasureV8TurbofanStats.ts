import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import * as V8TurbofanStats from '../V8TurbofanStats/V8TurbofanStats.ts'
import { DevtoolsProtocolTracing } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

interface TraceState {
  complete: Promise<void>
  dataLossOccurred: boolean
  dispose: () => void
  events: Dynamic[]
}

export const id = MeasureId.V8TurbofanStats

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
    throw new Error(`V8 TurboFan stats require a session with event listener support`)
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
      includedCategories: [
        '-*',
        'v8',
        'disabled-by-default-v8.compile',
        'disabled-by-default-v8.turbofan',
        'disabled-by-default-v8.wasm.turbofan',
        'disabled-by-default-v8.turbofan_stats',
        'disabled-by-default-v8.turbofan_statistics',
      ],
      recordMode: 'recordUntilFull',
    },
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
  return V8TurbofanStats.getV8TurbofanStats([])
}

export const stop = async (session: Session, state: { trace: TraceState }) => {
  await DevtoolsProtocolTracing.end(session, {})
  await state.trace.complete
  return V8TurbofanStats.getV8TurbofanStats(state.trace.events, state.trace.dataLossOccurred)
}

export const releaseResources = async (_session: Session, state: { trace: TraceState }) => {
  state.trace.dispose()
}

export const compare = (_before: Dynamic, after: Dynamic) => {
  return {
    isLeak: false,
    metrics: after.metrics,
    raw: {
      after: after.rawEvents,
      before: _before.rawEvents,
    },
    topDeoptimizedFunctions: after.topDeoptimizedFunctions,
    topOptimizedFunctions: after.topOptimizedFunctions,
    topPhases: after.topPhases,
  }
}

export const isLeak = () => {
  return false
}

export const summary = ({ metrics, topDeoptimizedFunctions, topOptimizedFunctions, topPhases }: Dynamic) => {
  return V8TurbofanStats.formatV8TurbofanStatsSummary({
    metrics,
    rawEvents: [],
    topDeoptimizedFunctions,
    topOptimizedFunctions,
    topPhases,
  })
}
