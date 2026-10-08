import { mkdir, open } from 'node:fs/promises'
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
  stream: string
}

const TraceTimeout = 10000
const StreamChunkBytes = 256 * 1024
const MaxTraceBytes = 256 * 1024 * 1024

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
  const { promise, resolve } = Promise.withResolvers<void>()
  let disposed = false
  const state: TraceState = {
    complete: promise,
    dataLossOccurred: false,
    dispose: cleanup,
    stream: '',
  }
  function cleanup(): void {
    if (disposed) {
      return
    }
    disposed = true
    removeListener(session, DevtoolsEventType.TracingTracingComplete, handleTracingComplete)
  }
  function handleTracingComplete(message: Dynamic): void {
    state.dataLossOccurred = message?.params?.dataLossOccurred === true
    state.stream = typeof message?.params?.stream === 'string' ? message.params.stream : ''
    cleanup()
    resolve()
  }
  if (typeof session.on !== 'function') {
    throw new Error('Chromium memory dumps require a session with event listener support')
  }
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
    transferMode: 'ReturnAsStream',
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
    await withTraceTimeout(
      (async () => {
        await DevtoolsProtocolTracing.end(state.browserSession, {})
        await state.trace.complete
      })(),
      'completion',
    )
  } finally {
    state.active = false
  }
}

async function withTraceTimeout<T>(operation: Promise<T>, phase: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`Chromium trace ${phase} timed out after ${TraceTimeout}ms`)), TraceTimeout)
      }),
    ])
  } finally {
    clearTimeout(timeout)
  }
}

async function invokeStream<T>(
  state: ChromiumMemoryDumpCaptureState,
  method: 'IO.read' | 'IO.close',
  params: { handle: string; size?: number },
): Promise<T> {
  if (!state.browserSession) throw new Error('Chromium trace stream requires the browser connection')
  const response = await withTraceTimeout(state.browserSession.invoke<{ result: T; error?: { message: string } }>(method, params), method)
  if (response.error) throw new Error(`Chromium trace ${method} failed: ${response.error.message.slice(0, 160)}`)
  return response.result
}

async function closeTraceStream(state: ChromiumMemoryDumpCaptureState): Promise<void> {
  const handle = state.trace.stream
  state.trace.stream = ''
  if (handle) await invokeStream(state, 'IO.close', { handle })
}

async function writeStreamCapture(state: ChromiumMemoryDumpCaptureState): Promise<void> {
  const handle = state.trace.stream
  if (!handle) throw new Error('Chromium completed tracing without a stream handle')
  let completed = false
  try {
    await mkdir(dirname(state.capturePath), { recursive: true })
    const output = await open(state.capturePath, 'w')
    try {
      const metadata = JSON.stringify({ dataLossOccurred: state.trace.dataLossOccurred, inspectedPid: state.inspectedPid })
      await output.writeFile(`${metadata.slice(0, -1)},"trace":`)
      let bytes = 0
      while (true) {
        const result = await invokeStream<{ data: string; eof: boolean; base64Encoded?: boolean }>(state, 'IO.read', {
          handle,
          size: StreamChunkBytes,
        })
        if (typeof result?.data !== 'string' || typeof result.eof !== 'boolean')
          throw new Error('Chromium trace stream returned an invalid chunk')
        const chunk = Buffer.from(result.data, result.base64Encoded ? 'base64' : 'utf8')
        if (chunk.length > StreamChunkBytes) throw new Error('Chromium trace stream exceeded its requested chunk size')
        bytes += chunk.length
        if (bytes > MaxTraceBytes) throw new Error(`Chromium trace exceeds the ${MaxTraceBytes} byte capture budget`)
        if (!chunk.length && !result.eof) throw new Error('Chromium trace stream made no progress')
        await output.writeFile(chunk)
        if (result.eof) break
      }
      await output.writeFile('}')
      completed = true
    } finally {
      await output.close()
    }
  } finally {
    try {
      await closeTraceStream(state)
    } catch (error) {
      if (completed) throw error
    }
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
      await closeTraceStream(state)
      throw error
    }
    setUnsupported(state, getErrorMessage(error))
  }
  if (!state.supported && state.active) {
    await stopActiveTrace(state)
    await closeTraceStream(state)
  }
  return state.unsupportedReason
}

export async function stop(state: ChromiumMemoryDumpCaptureState): Promise<ChromiumMemoryDumpCaptureResult> {
  if (!state.supported) {
    if (state.active) {
      await stopActiveTrace(state)
    }
    await closeTraceStream(state)
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
    await closeTraceStream(state)
    return { path: '', unsupportedReason: state.unsupportedReason }
  }
  await writeStreamCapture(state)
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
    try {
      await closeTraceStream(state)
    } catch {
      // The browser may also be gone while releasing its owned stream.
    }
  }
}
