import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as CssSelectorStats from '../CssSelectorStats/CssSelectorStats.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import { DevtoolsProtocolTracing } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

interface TraceState {
  complete: Promise<void>
  dispose: () => void
  events: Dynamic[]
}

export const id = MeasureId.CssSelectorStats

export const targets = [TargetId.Browser]

const emptyTraceState = (): TraceState => {
  return {
    complete: Promise.resolve(),
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
    throw new Error(`Tracing events require a session with event listener support`)
  }
  session.on(event, listener)
}

const createTraceState = (session: Session): TraceState => {
  const events: Dynamic[] = []
  const { promise, resolve } = Promise.withResolvers<void>()
  let disposed = false
  const cleanup = (): void => {
    if (disposed) {
      return
    }
    disposed = true
    removeListener(session, DevtoolsEventType.TracingDataCollected, handleDataCollected)
    removeListener(session, DevtoolsEventType.TracingTracingComplete, handleTracingComplete)
  }
  const handleDataCollected = (message: Dynamic): void => {
    const value = message?.params?.value
    if (Array.isArray(value)) {
      events.push(...value)
    }
  }
  const handleTracingComplete = (): void => {
    cleanup()
    resolve()
  }
  addListener(session, DevtoolsEventType.TracingDataCollected, handleDataCollected)
  addListener(session, DevtoolsEventType.TracingTracingComplete, handleTracingComplete)
  return {
    complete: promise,
    dispose: cleanup,
    events,
  }
}

const getTraceOptions = () => {
  return {
    transferMode: 'ReportEvents',
    traceConfig: {
      includedCategories: [
        '-*',
        'devtools.timeline',
        'disabled-by-default-devtools.timeline',
        'disabled-by-default-blink.debug',
        'disabled-by-default-devtools.timeline.invalidationTracking',
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
  return CssSelectorStats.getCssSelectorStats([])
}

export const stop = async (session: Session, state: { trace: TraceState }) => {
  await DevtoolsProtocolTracing.end(session, {})
  await state.trace.complete
  return CssSelectorStats.getCssSelectorStats(state.trace.events)
}

export const releaseResources = async (_session: Session, state: { trace: TraceState }) => {
  state.trace.dispose()
}

export const compare = (_before: Dynamic, after: Dynamic) => {
  return {
    isLeak: false,
    metrics: after.metrics,
    raw: {
      after,
      before: _before,
    },
    topSelectors: after.topSelectors,
  }
}

export const isLeak = () => {
  return false
}

export const summary = ({ metrics, topSelectors }: Dynamic) => {
  return CssSelectorStats.formatCssSelectorStatsSummary({ metrics, topSelectors })
}
