import { setTimeout as sleep } from 'node:timers/promises'
import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export interface ProcessCpuSample {
  readonly type: string
  readonly id: number
  readonly cpuTimeMs: number
}

export interface IdleWindow {
  readonly supported: true
  readonly windowMs: number
  readonly elapsedMs: number
  readonly first: readonly ProcessCpuSample[]
  readonly last: readonly ProcessCpuSample[]
}

export interface UnsupportedWindow {
  readonly supported: false
  readonly reason: string
}

export type WindowResult = IdleWindow | UnsupportedWindow

export interface IdleCpuRow {
  readonly type: string
  readonly id: number
  readonly idleCpuBeforeMs: number
  readonly idleCpuAfterMs: number
  readonly deltaMs: number
}

export interface IdleCpuTypeRow {
  readonly type: string
  readonly processCount: number
  readonly idleCpuBeforeMs: number
  readonly idleCpuAfterMs: number
  readonly deltaMs: number
}

export interface IdleCpuResult {
  readonly supported: boolean
  readonly unsupportedReason: string
  readonly windowMs: number
  readonly elapsedBeforeMs: number
  readonly elapsedAfterMs: number
  readonly idleCpuBeforeMs: number
  readonly idleCpuAfterMs: number
  readonly deltaMs: number
  readonly processes: readonly IdleCpuRow[]
  readonly types: readonly IdleCpuTypeRow[]
  readonly unmatchedProcesses: readonly { readonly type: string; readonly id: number }[]
  readonly isLeak: false
}

export type Delay = (milliseconds: number, signal: AbortSignal) => Promise<void>

export interface State {
  readonly session: Session
  readonly windowMs: number
  readonly delay: Delay
  readonly controller: AbortController
  readonly now: () => number
}

export const DefaultWindowMs = 3000

export const id = MeasureId.IdleCpuAfterScenario

export const targets = [TargetId.Browser]

const defaultDelay: Delay = async (milliseconds, signal) => {
  await sleep(milliseconds, undefined, { signal })
}

export const createState = (
  session: Session,
  {
    delay = defaultDelay,
    now = () => performance.now(),
    windowMs = DefaultWindowMs,
  }: Partial<Pick<State, 'delay' | 'now' | 'windowMs'>> = {},
): State => {
  return { controller: new AbortController(), delay, now, session, windowMs }
}

export const create = (session: Session) => {
  return [createState(session)]
}

const unsupported = (reason: string): UnsupportedWindow => ({ reason, supported: false })

const isProcessInfo = (value: Dynamic): boolean => {
  return (
    typeof value?.type === 'string' &&
    Number.isSafeInteger(value.id) &&
    typeof value.cpuTime === 'number' &&
    Number.isFinite(value.cpuTime) &&
    value.cpuTime >= 0
  )
}

// SystemInfo.getProcessInfo is only answered by the root browser target, so
// the raw `{ result }` / `{ error }` response of the browser connection is read.
export const getProcessInfo = async (session: Session): Promise<readonly ProcessCpuSample[] | UnsupportedWindow> => {
  if (typeof session.invokeBrowser !== 'function') {
    return unsupported('The inspected target does not expose the root Chromium browser connection')
  }
  const response: Dynamic = await session.invokeBrowser('SystemInfo.getProcessInfo')
  if (response?.error) {
    const message = typeof response.error.message === 'string' ? response.error.message : 'unknown error'
    return unsupported(`SystemInfo.getProcessInfo failed: ${message.slice(0, 160)}`)
  }
  const processInfo = response?.result?.processInfo
  if (!Array.isArray(processInfo) || !processInfo.every(isProcessInfo)) {
    return unsupported('SystemInfo.getProcessInfo returned an unexpected response')
  }
  return processInfo.map((info: Dynamic) => ({
    cpuTimeMs: Math.round(info.cpuTime * 1000),
    id: info.id,
    type: info.type,
  }))
}

export const measureWindow = async (state: State): Promise<WindowResult> => {
  if (state.controller.signal.aborted) {
    return unsupported('The idle window was cancelled before completion')
  }
  const first = await getProcessInfo(state.session)
  if (!Array.isArray(first)) {
    return first as UnsupportedWindow
  }
  const startTime = state.now()
  try {
    await state.delay(state.windowMs, state.controller.signal)
  } catch (error) {
    if (state.controller.signal.aborted) {
      return unsupported('The idle window was cancelled before completion')
    }
    throw error
  }
  const last = await getProcessInfo(state.session)
  if (!Array.isArray(last)) {
    return last as UnsupportedWindow
  }
  return {
    elapsedMs: Math.round(state.now() - startTime),
    first,
    last,
    supported: true,
    windowMs: state.windowMs,
  }
}

export const start = measureWindow

export const stop = measureWindow

export const releaseResources = (state: State): void => {
  state.controller.abort()
}

const getKey = (sample: { readonly type: string; readonly id: number }): string => {
  return `${sample.type}:${sample.id}`
}

const toMap = (samples: readonly ProcessCpuSample[]): Map<string, ProcessCpuSample> => {
  return new Map(samples.map((sample) => [getKey(sample), sample]))
}

const emptyResult = (reason: string, windowMs: number): IdleCpuResult => ({
  deltaMs: 0,
  elapsedAfterMs: 0,
  elapsedBeforeMs: 0,
  idleCpuAfterMs: 0,
  idleCpuBeforeMs: 0,
  isLeak: false,
  processes: [],
  supported: false,
  types: [],
  unmatchedProcesses: [],
  unsupportedReason: reason,
  windowMs,
})

export const compare = (before: WindowResult, after: WindowResult): IdleCpuResult => {
  if (!before.supported) {
    return emptyResult(before.reason, 0)
  }
  if (!after.supported) {
    return emptyResult(after.reason, before.windowMs)
  }
  const maps = [before.first, before.last, after.first, after.last].map(toMap)
  const processes: IdleCpuRow[] = []
  const unmatched = new Map<string, { type: string; id: number }>()
  for (const map of maps) {
    for (const [key, sample] of map) {
      const samples = maps.map((other) => other.get(key))
      if (samples.some((value) => value === undefined)) {
        unmatched.set(key, { id: sample.id, type: sample.type })
        continue
      }
      if (map !== maps[0]) {
        continue
      }
      const [b0, b1, a0, a1] = samples.map((value) => value!.cpuTimeMs)
      // CPU time is monotonic for one process; a decrease means the id was reused.
      if (b1 < b0 || a0 < b1 || a1 < a0) {
        unmatched.set(key, { id: sample.id, type: sample.type })
        continue
      }
      const idleCpuBeforeMs = b1 - b0
      const idleCpuAfterMs = a1 - a0
      processes.push({ deltaMs: idleCpuAfterMs - idleCpuBeforeMs, id: sample.id, idleCpuAfterMs, idleCpuBeforeMs, type: sample.type })
    }
  }
  processes.sort((a, b) => b.deltaMs - a.deltaMs || a.type.localeCompare(b.type) || a.id - b.id)
  const typeMap = new Map<string, IdleCpuTypeRow>()
  for (const row of processes) {
    const total = typeMap.get(row.type) ?? { deltaMs: 0, idleCpuAfterMs: 0, idleCpuBeforeMs: 0, processCount: 0, type: row.type }
    typeMap.set(row.type, {
      deltaMs: total.deltaMs + row.deltaMs,
      idleCpuAfterMs: total.idleCpuAfterMs + row.idleCpuAfterMs,
      idleCpuBeforeMs: total.idleCpuBeforeMs + row.idleCpuBeforeMs,
      processCount: total.processCount + 1,
      type: row.type,
    })
  }
  const types = [...typeMap.values()].sort((a, b) => b.deltaMs - a.deltaMs || a.type.localeCompare(b.type))
  const idleCpuBeforeMs = processes.reduce((sum, row) => sum + row.idleCpuBeforeMs, 0)
  const idleCpuAfterMs = processes.reduce((sum, row) => sum + row.idleCpuAfterMs, 0)
  return {
    deltaMs: idleCpuAfterMs - idleCpuBeforeMs,
    elapsedAfterMs: after.elapsedMs,
    elapsedBeforeMs: before.elapsedMs,
    idleCpuAfterMs,
    idleCpuBeforeMs,
    isLeak: false,
    processes,
    supported: true,
    types,
    unmatchedProcesses: [...unmatched.values()],
    unsupportedReason: '',
    windowMs: before.windowMs,
  }
}

// Idle CPU is noisy and not a retained-memory signal, so it is informational only.
export const isLeak = (): false => false

export const summary = (result: IdleCpuResult): string => {
  if (!result.supported) {
    return `Idle CPU after scenario unavailable: ${result.unsupportedReason}`
  }
  const top = result.processes[0]
  const topText = top ? `; top ${top.type} ${top.id}: ${top.idleCpuBeforeMs} -> ${top.idleCpuAfterMs} ms` : ''
  const sign = result.deltaMs > 0 ? '+' : ''
  return `Idle CPU over ${result.windowMs} ms windows: ${result.idleCpuBeforeMs} ms before, ${result.idleCpuAfterMs} ms after (${sign}${result.deltaMs} ms) across ${result.processes.length} processes${topText}`
}
