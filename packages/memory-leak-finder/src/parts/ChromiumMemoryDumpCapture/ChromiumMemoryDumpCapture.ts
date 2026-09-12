import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Session } from '../Session/Session.ts'
import type { Dynamic } from '../Types/Types.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolErrorCodes, DevtoolsProtocolTracing } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetElectronWindowProcessId from '../GetElectronWindowProcessId/GetElectronWindowProcessId.ts'

interface TraceState {
  readonly complete: Promise<void>
  dataLossOccurred: boolean
  readonly dispose: () => void
  readonly events: Dynamic[]
}

export interface ChromiumMemoryDumpCaptureState {
  active: boolean
  readonly browserSession: Session | null
  readonly capturePath: string
  captured: boolean
  inspectedPid: number | undefined
  supported: boolean
  readonly targetId: string
  readonly trace: TraceState
  unsupportedReason: string
  readonly electronWebSocketUrl: string
}

export interface ChromiumMemoryDumpCaptureResult {
  readonly path: string
  readonly unsupportedReason: string
}

function removeListener(session: Dynamic, event: string, listener: Dynamic): void {
  if (typeof session.off === 'function') {
    session.off(event, listener)
  }
  if (session.listeners?.[event] === listener) {
    delete session.listeners[event]
  }
}

function createTraceState(session: Session): TraceState {
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

function createBrowserSession(session: Session): Session | null {
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

function getTraceOptions() {
  return {
    traceConfig: {
      excludedCategories: ['*'],
      includedCategories: ['disabled-by-default-memory-infra'],
      recordMode: 'recordAsMuchAsPossible',
    },
    transferMode: 'ReportEvents',
  }
}

function getDumpOptions() {
  return {
    deterministic: true,
    levelOfDetail: 'detailed',
  }
}

function isMethodNotFoundError(error: Dynamic): boolean {
  return error?.code === DevtoolsProtocolErrorCodes.E_DEVTOOLS_METHOD_NOT_FOUND
}

function getErrorMessage(error: Dynamic): string {
  return typeof error?.message === 'string' ? error.message : 'Chromium detailed memory dumps are unavailable'
}

function setUnsupported(state: ChromiumMemoryDumpCaptureState, reason: string): void {
  state.supported = false
  state.unsupportedReason = reason
}

async function requestDetailedDump(state: ChromiumMemoryDumpCaptureState): Promise<boolean> {
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

async function stopActiveTrace(state: ChromiumMemoryDumpCaptureState): Promise<void> {
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

async function resolveInspectedPid(state: ChromiumMemoryDumpCaptureState): Promise<void> {
  if (!state.electronWebSocketUrl || !state.targetId) {
    return
  }
  try {
    state.inspectedPid = await GetElectronWindowProcessId.getElectronWindowProcessId(state.electronWebSocketUrl, state.targetId)
  } catch {
    // Process highlighting is best-effort and does not affect the dump itself.
  }
}

export function create(session: Session, capturePath: string): ChromiumMemoryDumpCaptureState {
  const dynamicSession = session as Dynamic
  const state: ChromiumMemoryDumpCaptureState = {
    active: false,
    browserSession: createBrowserSession(session),
    capturePath,
    captured: false,
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
  return state
}

export async function start(state: ChromiumMemoryDumpCaptureState): Promise<string> {
  if (!state.supported || !state.browserSession) {
    return state.unsupportedReason
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
  return state.unsupportedReason
}

export async function stop(state: ChromiumMemoryDumpCaptureState): Promise<ChromiumMemoryDumpCaptureResult> {
  if (!state.supported) {
    if (state.active) {
      await stopActiveTrace(state)
    }
    return { path: '', unsupportedReason: state.unsupportedReason }
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
    return { path: '', unsupportedReason: state.unsupportedReason }
  }
  await mkdir(dirname(state.capturePath), { recursive: true })
  await writeFile(
    state.capturePath,
    JSON.stringify({
      dataLossOccurred: state.trace.dataLossOccurred,
      inspectedPid: state.inspectedPid,
      traceEvents: state.trace.events,
    }),
  )
  state.trace.events.length = 0
  state.captured = true
  return { path: state.capturePath, unsupportedReason: '' }
}

export async function release(state: ChromiumMemoryDumpCaptureState): Promise<void> {
  try {
    await stopActiveTrace(state)
  } catch {
    // The browser may already be gone while the coordinator is cleaning up.
  } finally {
    state.trace.dispose()
    state.trace.events.length = 0
  }
}
