import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import {
  createChromiumMemoryDumpResult,
  createUnsupportedResult,
  formatChromiumMemoryDumpSummary,
  type ChromiumMemoryDumpResult,
} from '../ChromiumMemoryDump/ChromiumMemoryDump.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolErrorCodes, DevtoolsProtocolTracing } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetElectronWindowProcessId from '../GetElectronWindowProcessId/GetElectronWindowProcessId.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface TraceState {
  readonly complete: Promise<void>
  dataLossOccurred: boolean
  readonly dispose: () => void
  readonly events: Dynamic[]
}

interface ChromiumMemoryDumpState {
  active: boolean
  readonly browserSession: Session | null
  inspectedPid: number | undefined
  supported: boolean
  readonly targetId: string
  readonly trace: TraceState
  unsupportedReason: string
  readonly electronWebSocketUrl: string
}

export const id = MeasureId.ChromiumMemoryDump
export const targets = [TargetId.Browser]

const removeListener = (session: Dynamic, event: string, listener: Dynamic): void => {
  if (typeof session.off === 'function') {
    session.off(event, listener)
  }
  if (session.listeners?.[event] === listener) {
    delete session.listeners[event]
  }
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
    const values = message?.params?.value
    if (Array.isArray(values)) {
      events.push(...values)
    }
  }
  function handleTracingComplete(message: Dynamic): void {
    state.dataLossOccurred = message?.params?.dataLossOccurred === true
    cleanup()
    resolve()
  }
  if (typeof session.on !== 'function') {
    throw new Error('Chromium memory dumps require a session with event listener support')
  }
  session.on(DevtoolsEventType.TracingDataCollected, handleDataCollected)
  session.on(DevtoolsEventType.TracingTracingComplete, handleTracingComplete)
  return state
}

const createBrowserSession = (session: Session): Session | null => {
  if (typeof session.invokeBrowser !== 'function') {
    return null
  }
  return {
    ...session,
    invoke(method: string, ...params: readonly unknown[]) {
      return session.invokeBrowser!(method, ...params)
    },
  }
}

const getTraceOptions = () => ({
  traceConfig: {
    excludedCategories: ['*'],
    includedCategories: ['disabled-by-default-memory-infra'],
    recordMode: 'recordAsMuchAsPossible',
  },
  transferMode: 'ReportEvents',
})

const getDumpOptions = () => ({
  deterministic: true,
  levelOfDetail: 'detailed',
})

const isMethodNotFoundError = (error: Dynamic): boolean => error?.code === DevtoolsProtocolErrorCodes.E_DEVTOOLS_METHOD_NOT_FOUND

const getErrorMessage = (error: Dynamic): string => {
  return typeof error?.message === 'string' ? error.message : 'Chromium detailed memory dumps are unavailable'
}

const setUnsupported = (state: ChromiumMemoryDumpState, reason: string): void => {
  state.supported = false
  state.unsupportedReason = reason
}

const requestDetailedDump = async (state: ChromiumMemoryDumpState): Promise<boolean> => {
  if (!state.browserSession) {
    return false
  }
  const response = await DevtoolsProtocolTracing.requestMemoryDump(state.browserSession, getDumpOptions())
  if (response?.success !== true) {
    setUnsupported(state, 'Chromium did not complete the detailed memory dump request')
    return false
  }
  return true
}

const stopActiveTrace = async (state: ChromiumMemoryDumpState): Promise<void> => {
  if (!state.active || !state.browserSession) {
    return
  }
  try {
    await DevtoolsProtocolTracing.end(state.browserSession, {})
    await state.trace.complete
  } finally {
    state.active = false
  }
}

const resolveInspectedPid = async (state: ChromiumMemoryDumpState): Promise<void> => {
  if (!state.electronWebSocketUrl || !state.targetId) {
    return
  }
  try {
    state.inspectedPid = await GetElectronWindowProcessId.getElectronWindowProcessId(state.electronWebSocketUrl, state.targetId)
  } catch {
    // Process highlighting is best-effort and does not affect the dump itself.
  }
}

export const create = (session: Session) => {
  const dynamicSession = session as Dynamic
  const state: ChromiumMemoryDumpState = {
    active: false,
    browserSession: createBrowserSession(session),
    electronWebSocketUrl: typeof dynamicSession.electronWebSocketUrl === 'string' ? dynamicSession.electronWebSocketUrl : '',
    inspectedPid: undefined,
    supported: true,
    targetId: typeof dynamicSession.targetId === 'string' ? dynamicSession.targetId : '',
    trace: createTraceState(session),
    unsupportedReason: '',
  }
  if (!state.browserSession) {
    setUnsupported(state, 'The inspected target does not expose the root Chromium browser connection')
  }
  return [session, state] as const
}

export const start = async (_session: Session, state: ChromiumMemoryDumpState): Promise<ChromiumMemoryDumpResult> => {
  if (!state.supported || !state.browserSession) {
    return createUnsupportedResult(state.unsupportedReason)
  }
  await resolveInspectedPid(state)
  try {
    await DevtoolsProtocolTracing.start(state.browserSession, getTraceOptions())
    state.active = true
    await requestDetailedDump(state)
  } catch (error) {
    if (!isMethodNotFoundError(error)) {
      if (state.active) {
        await stopActiveTrace(state)
      }
      throw error
    }
    setUnsupported(state, getErrorMessage(error))
  }
  if (!state.supported && state.active) {
    await stopActiveTrace(state)
  }
  return state.supported ? createChromiumMemoryDumpResult([], false, state.inspectedPid) : createUnsupportedResult(state.unsupportedReason)
}

export const stop = async (_session: Session, state: ChromiumMemoryDumpState): Promise<ChromiumMemoryDumpResult> => {
  if (!state.supported) {
    if (state.active) {
      await stopActiveTrace(state)
    }
    return createUnsupportedResult(state.unsupportedReason)
  }
  try {
    await requestDetailedDump(state)
  } catch (error) {
    if (!isMethodNotFoundError(error)) {
      throw error
    }
    setUnsupported(state, getErrorMessage(error))
  } finally {
    if (state.active) {
      await stopActiveTrace(state)
    }
  }
  if (!state.supported) {
    return createUnsupportedResult(state.unsupportedReason)
  }
  return createChromiumMemoryDumpResult(state.trace.events, state.trace.dataLossOccurred, state.inspectedPid)
}

export const compare = (_before: ChromiumMemoryDumpResult, after: ChromiumMemoryDumpResult): ChromiumMemoryDumpResult => after

export const isLeak = (): false => false

export const summary = (result: ChromiumMemoryDumpResult): string => formatChromiumMemoryDumpSummary(result)

export const releaseResources = async (_session: Session, state: ChromiumMemoryDumpState): Promise<void> => {
  try {
    await stopActiveTrace(state)
  } catch {
    // The browser may already be gone while the coordinator is cleaning up.
  } finally {
    state.trace.dispose()
  }
}
