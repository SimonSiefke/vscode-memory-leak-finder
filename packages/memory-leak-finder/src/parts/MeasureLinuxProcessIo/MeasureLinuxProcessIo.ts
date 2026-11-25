import { readFile, readdir } from 'node:fs/promises'
import type { Dynamic } from '../Types/Types.ts'
import type { Identity } from '../MeasureLinuxProcessMemory/MeasureLinuxProcessMemory.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import { parseStat, selectTree } from '../MeasureLinuxProcessMemory/MeasureLinuxProcessMemory.ts'

export interface IoCounters {
  /** Bytes passed to read-like syscalls, including pipes, sockets and page-cache hits. */
  readonly rchar: number
  /** Bytes passed to write-like syscalls, including pipes and sockets. */
  readonly wchar: number
  readonly syscr: number
  readonly syscw: number
  /** Bytes the storage layer fetched for this process. */
  readonly readBytes: number
  /** Bytes this process caused to be sent to the storage layer (attributed when pages are dirtied). */
  readonly writeBytes: number
  readonly cancelledWriteBytes: number
}
export interface IoRow extends Identity {
  readonly io: IoCounters
}
export interface SnapshotError {
  readonly pid: number
  readonly code: string
  readonly message: string
}
export interface Snapshot {
  readonly capturedAt: string
  readonly rootPid: number
  readonly available: boolean
  readonly unavailableReason: string
  readonly processes: readonly IoRow[]
  readonly errors: readonly SnapshotError[]
}
export type Status = 'running' | 'started' | 'exited'
export interface Row extends Identity {
  readonly status: Status
  readonly before: IoCounters | null
  readonly after: IoCounters | null
  /** Running: after minus before. Started: lifetime counters, all accrued inside the window. Exited: null. */
  readonly delta: IoCounters | null
}
export interface Result {
  readonly available: boolean
  readonly unavailableReason: string
  readonly complete: boolean
  /** Sum of running-process deltas per field. Never add the syscall layer (rchar/wchar) to the storage layer (readBytes/writeBytes). */
  readonly totals: IoCounters | null
  readonly startedCount: number
  readonly exitedCount: number
  readonly rows: readonly Row[]
  readonly errors: readonly (SnapshotError & { readonly snapshot: 'before' | 'after' })[]
  readonly snapshots: { readonly before: Snapshot; readonly after: Snapshot }
}

const Fields = [
  ['rchar', 'rchar'],
  ['wchar', 'wchar'],
  ['syscr', 'syscr'],
  ['syscw', 'syscw'],
  ['read_bytes', 'readBytes'],
  ['write_bytes', 'writeBytes'],
  ['cancelled_write_bytes', 'cancelledWriteBytes'],
] as const

export const parseIo = (raw: string): IoCounters => {
  const values = new Map<string, number>()
  for (const line of raw.split('\n')) {
    const match = /^(\w+):\s+(\d+)\s*$/.exec(line)
    if (match) values.set(match[1], Number(match[2]))
  }
  const counters: Record<string, number> = {}
  for (const [kernelName, name] of Fields) {
    const value = values.get(kernelName)
    if (value === undefined || !Number.isSafeInteger(value)) throw new Error(`/proc/<pid>/io is missing ${kernelName}`)
    counters[name] = value
  }
  return counters as unknown as IoCounters
}

const subtract = (after: IoCounters, before: IoCounters): IoCounters => {
  const delta: Record<string, number> = {}
  for (const [, name] of Fields) delta[name] = after[name] - before[name]
  return delta as unknown as IoCounters
}

const sum = (rows: readonly IoCounters[]): IoCounters => {
  const total: Record<string, number> = {}
  for (const [, name] of Fields) total[name] = rows.reduce((value, row) => value + row[name], 0)
  return total as unknown as IoCounters
}

export const unavailable = (rootPid: number, reason: string): Snapshot => ({
  capturedAt: new Date().toISOString(),
  rootPid,
  available: false,
  unavailableReason: reason,
  processes: [],
  errors: [],
})

export const capture = async (rootPid: number, procRoot = '/proc'): Promise<Snapshot> => {
  const identity = async (pid: number) => parseStat(pid, await readFile(`${procRoot}/${pid}/stat`, 'utf8'))
  const sameProcess = async (row: Identity) => {
    try {
      return (await identity(row.pid)).startTime === row.startTime
    } catch {
      return false
    }
  }
  const root = await identity(rootPid)
  const rows: Identity[] = []
  for (const entry of await readdir(procRoot)) {
    if (!/^\d+$/.test(entry)) continue
    try {
      rows.push(await identity(Number(entry)))
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ESRCH') throw error
    }
  }
  const processes: IoRow[] = []
  const errors: SnapshotError[] = []
  for (const row of selectTree(rows, rootPid)) {
    let io: IoCounters
    try {
      io = parseIo(await readFile(`${procRoot}/${row.pid}/io`, 'utf8'))
    } catch (error) {
      // A descendant that exited mid-snapshot has no counters left; an inaccessible one (EACCES) is a real gap.
      if (!(await sameProcess(row))) continue
      errors.push({ pid: row.pid, code: error.code ?? 'EINVAL', message: error.message })
      continue
    }
    if (await sameProcess(row)) processes.push({ ...row, io })
  }
  if (!(await sameProcess(root))) throw new Error('Root process disappeared or changed during snapshot')
  return { capturedAt: new Date().toISOString(), rootPid, available: true, unavailableReason: '', processes, errors }
}

export const id = MeasureId.LinuxProcessIo
export const targets: readonly Dynamic[] = []
export const create = ({ pid }: { pid: number }) => [pid]
export const start = (pid: number): Promise<Snapshot> | Snapshot => {
  if (process.platform !== 'linux') return unavailable(pid, `linux-process-io requires Linux procfs (platform is ${process.platform})`)
  if (!Number.isSafeInteger(pid) || pid <= 0) return unavailable(pid, 'linux-process-io requires the application root PID')
  return capture(pid)
}
export const stop = start
export const releaseResources = () => undefined

const key = (row: Identity) => `${row.pid}:${row.startTime}`
const rank = (row: Row) => [row.delta?.writeBytes ?? -1, row.delta?.wchar ?? -1]

export const compare = (before: Snapshot, after: Snapshot): Result => {
  const errors = [
    ...before.errors.map((error) => ({ ...error, snapshot: 'before' as const })),
    ...after.errors.map((error) => ({ ...error, snapshot: 'after' as const })),
  ]
  if (!before.available || !after.available) {
    const unavailableReason = before.unavailableReason || after.unavailableReason
    return {
      available: false,
      unavailableReason,
      complete: false,
      totals: null,
      startedCount: 0,
      exitedCount: 0,
      rows: [],
      errors,
      snapshots: { before, after },
    }
  }
  const a = new Map(before.processes.map((row) => [key(row), row]))
  const b = new Map(after.processes.map((row) => [key(row), row]))
  const rows: Row[] = [...new Set([...a.keys(), ...b.keys()])].map((id) => {
    const previous = a.get(id)
    const current = b.get(id)
    const { io: _io, ...identity } = (current ?? previous)!
    if (previous && current)
      return { ...identity, status: 'running', before: previous.io, after: current.io, delta: subtract(current.io, previous.io) }
    if (current) return { ...identity, status: 'started', before: null, after: current.io, delta: current.io }
    return { ...identity, status: 'exited', before: previous!.io, after: null, delta: null }
  })
  rows.sort((x, y) => {
    const [xWrite, xWchar] = rank(x)
    const [yWrite, yWchar] = rank(y)
    return yWrite - xWrite || yWchar - xWchar
  })
  const running = rows.filter((row) => row.status === 'running')
  const startedCount = rows.filter((row) => row.status === 'started').length
  const exitedCount = rows.filter((row) => row.status === 'exited').length
  return {
    available: true,
    unavailableReason: '',
    complete: errors.length === 0 && startedCount === 0 && exitedCount === 0,
    totals: sum(running.map((row) => row.delta!)),
    startedCount,
    exitedCount,
    rows,
    errors,
    snapshots: { before, after },
  }
}

export const isLeak = (_result: Result) => false

const top = (rows: readonly Row[], field: keyof IoCounters) => {
  const row = rows.toSorted((x, y) => y.delta![field] - x.delta![field])[0]
  return row ? `${row.name} (PID ${row.pid}) ${row.delta![field]}` : 'none'
}

export const summary = (result: Result) => {
  if (!result.available) return `Linux process-tree I/O unavailable: ${result.unavailableReason}`
  const running = result.rows.filter((row) => row.status === 'running')
  const totals = result.totals!
  const notes = [
    result.startedCount ? `${result.startedCount} started` : '',
    result.exitedCount ? `${result.exitedCount} exited` : '',
    result.errors.length ? `${result.errors.length} unreadable` : '',
  ].filter(Boolean)
  return (
    `Linux process-tree I/O across ${running.length} running processes: storage write_bytes ${totals.writeBytes}, syscall wchar ${totals.wchar}; ` +
    `top write_bytes: ${top(running, 'writeBytes')}; top wchar: ${top(running, 'wchar')}` +
    (result.complete ? '' : ` (INCOMPLETE: ${notes.join(', ')}; totals cover running processes only)`) +
    '; diagnostic only, not a leak verdict'
  )
}
