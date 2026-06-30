import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as PaintEvents from '../PaintEvents/PaintEvents.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import { DevtoolsProtocolLayerTree, DevtoolsProtocolTracing } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

interface TraceState {
  complete: Promise<void>
  dataLossOccurred: boolean
  dispose: () => void
  layerPaintEvents: Dynamic[]
  layerTreeEvents: Dynamic[]
  traceEvents: Dynamic[]
}

export const id = MeasureId.PaintEvents

export const targets = [TargetId.Browser]

const emptyTraceState = (): TraceState => {
  return {
    complete: Promise.resolve(),
    dataLossOccurred: false,
    dispose() {},
    layerPaintEvents: [],
    layerTreeEvents: [],
    traceEvents: [],
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
    throw new Error(`Paint events require a session with event listener support`)
  }
  session.on(event, listener)
}

const createTraceState = (session: Session): TraceState => {
  const traceEvents: Dynamic[] = []
  const layerPaintEvents: Dynamic[] = []
  const layerTreeEvents: Dynamic[] = []
  const { promise, resolve } = Promise.withResolvers<void>()
  let disposed = false
  const state: TraceState = {
    complete: promise,
    dataLossOccurred: false,
    dispose: cleanup,
    layerPaintEvents,
    layerTreeEvents,
    traceEvents,
  }
  function cleanup(): void {
    if (disposed) {
      return
    }
    disposed = true
    removeListener(session, DevtoolsEventType.TracingDataCollected, handleDataCollected)
    removeListener(session, DevtoolsEventType.TracingTracingComplete, handleTracingComplete)
    removeListener(session, DevtoolsEventType.LayerTreeLayerPainted, handleLayerPainted)
    removeListener(session, DevtoolsEventType.LayerTreeLayerTreeDidChange, handleLayerTreeDidChange)
  }
  function handleDataCollected(message: Dynamic): void {
    const value = message?.params?.value
    if (Array.isArray(value)) {
      traceEvents.push(...value)
    }
  }
  function handleTracingComplete(message: Dynamic): void {
    state.dataLossOccurred = message?.params?.dataLossOccurred === true
    cleanup()
    resolve()
  }
  function handleLayerPainted(message: Dynamic): void {
    layerPaintEvents.push(message)
  }
  function handleLayerTreeDidChange(message: Dynamic): void {
    layerTreeEvents.push(message)
  }
  addListener(session, DevtoolsEventType.TracingDataCollected, handleDataCollected)
  addListener(session, DevtoolsEventType.TracingTracingComplete, handleTracingComplete)
  addListener(session, DevtoolsEventType.LayerTreeLayerPainted, handleLayerPainted)
  addListener(session, DevtoolsEventType.LayerTreeLayerTreeDidChange, handleLayerTreeDidChange)
  return state
}

const getTraceOptions = () => {
  return {
    transferMode: 'ReportEvents',
    traceConfig: {
      includedCategories: [
        '-*',
        'devtools.timeline',
        'disabled-by-default-devtools.timeline',
        'disabled-by-default-devtools.timeline.layers',
        'disabled-by-default-devtools.timeline.picture',
        'disabled-by-default-cc',
        'disabled-by-default-cc.debug',
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
  await DevtoolsProtocolLayerTree.enable(session, {})
  await DevtoolsProtocolTracing.start(session, getTraceOptions())
  return PaintEvents.getPaintEvents([])
}

export const stop = async (session: Session, state: { trace: TraceState }) => {
  await DevtoolsProtocolTracing.end(session, {})
  await state.trace.complete
  await DevtoolsProtocolLayerTree.disable(session, {})
  return PaintEvents.getPaintEvents(
    state.trace.traceEvents,
    state.trace.layerPaintEvents,
    state.trace.layerTreeEvents,
    state.trace.dataLossOccurred,
  )
}

export const releaseResources = async (_session: Session, state: { trace: TraceState }) => {
  state.trace.dispose()
}

export const compare = (_before: Dynamic, after: Dynamic) => {
  return {
    events: after.events,
    isLeak: false,
    metrics: after.metrics,
    raw: {
      after: {
        layerPaintEvents: after.layerPaintEvents,
        layerTreeEvents: after.layerTreeEvents,
        traceEvents: after.rawEvents,
      },
      before: {
        layerPaintEvents: _before.layerPaintEvents,
        layerTreeEvents: _before.layerTreeEvents,
        traceEvents: _before.rawEvents,
      },
    },
  }
}

export const isLeak = () => {
  return false
}

export const summary = ({ events, metrics }: Dynamic) => {
  return PaintEvents.formatPaintEventsSummary({ events, layerPaintEvents: [], layerTreeEvents: [], metrics, rawEvents: [] })
}
