import { readFile, readdir } from 'node:fs/promises'
import type { Dynamic } from '../Types/Types.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export interface Identity {
  readonly pid: number
  readonly parentPid: number
  readonly startTime: string
  readonly name: string
}
export interface MemoryRow extends Identity {
  readonly pssBytes: number
  readonly rssBytes: number
  readonly privateBytes: number
  readonly swapPssBytes: number
}
export interface Snapshot {
  readonly capturedAt: string
  readonly rootPid: number
  readonly processes: readonly MemoryRow[]
  readonly errors: readonly { pid: number; message: string }[]
}

export const parseStat = (pid: number, raw: string): Identity => {
  const end = raw.lastIndexOf(')')
  const fields = raw
    .slice(end + 2)
    .trim()
    .split(/\s+/)
  if (end < 0 || !/^\d+$/.test(fields[19] ?? '') || !/^\d+$/.test(fields[1] ?? '')) throw new Error(`Invalid stat for PID ${pid}`)
  return { pid, name: raw.slice(raw.indexOf('(') + 1, end), parentPid: Number(fields[1]), startTime: fields[19] }
}

export const parseSmaps = (raw: string) => {
  const fields = new Map<string, number>()
  for (const line of raw.split('\n')) {
    const match = /^(\w+):\s+(\d+) kB\s*$/.exec(line)
    if (match) fields.set(match[1], Number(match[2]) * 1024)
  }
  for (const key of ['Pss', 'Rss', 'Private_Clean', 'Private_Dirty', 'SwapPss']) {
    if (!fields.has(key)) throw new Error(`smaps_rollup is missing ${key}`)
  }
  return {
    pssBytes: fields.get('Pss')!,
    rssBytes: fields.get('Rss')!,
    privateBytes: fields.get('Private_Clean')! + fields.get('Private_Dirty')! + (fields.get('Private_Hugetlb') ?? 0),
    swapPssBytes: fields.get('SwapPss')!,
  }
}

export const selectTree = (rows: readonly Identity[], rootPid: number): readonly Identity[] => {
  const selected = new Set([rootPid])
  // Build an adjacency map so large process trees do not require quadratic scans.
  const children = new Map<number, Identity[]>()
  for (const row of rows) {
    const siblings = children.get(row.parentPid) ?? []
    siblings.push(row)
    children.set(row.parentPid, siblings)
  }
  for (const pid of selected) for (const child of children.get(pid) ?? []) selected.add(child.pid)
  return rows.filter((row) => selected.has(row.pid))
}

export const capture = async (rootPid: number, procRoot = '/proc'): Promise<Snapshot> => {
  const identity = async (pid: number) => parseStat(pid, await readFile(`${procRoot}/${pid}/stat`, 'utf8'))
  const root = await identity(rootPid)
  const rows: Identity[] = []
  const errors: { pid: number; message: string }[] = []
  for (const entry of await readdir(procRoot)) {
    if (!/^\d+$/.test(entry)) continue
    try {
      rows.push(await identity(Number(entry)))
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ESRCH') throw error
    }
  }
  const processes: MemoryRow[] = []
  for (const row of selectTree(rows, rootPid)) {
    try {
      const memory = parseSmaps(await readFile(`${procRoot}/${row.pid}/smaps_rollup`, 'utf8'))
      const after = await identity(row.pid)
      if (after.startTime !== row.startTime) throw new Error('PID identity changed during snapshot')
      processes.push({ ...row, ...memory })
    } catch (error) {
      // An inaccessible or exiting descendant makes this a partial snapshot.
      errors.push({ pid: row.pid, message: error.message })
    }
  }
  const rootAfter = await identity(rootPid)
  if (root.startTime !== rootAfter.startTime || !processes.some((row) => row.pid === rootPid))
    throw new Error('Root process disappeared or changed during snapshot')
  return { capturedAt: new Date().toISOString(), rootPid, processes, errors }
}

export const id = MeasureId.LinuxProcessMemory
export const targets: readonly Dynamic[] = []
export const create = ({ pid }: { pid: number }) => {
  if (process.platform !== 'linux') throw new Error('linux-process-memory requires Linux')
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('linux-process-memory requires a root PID')
  return [pid]
}
export const start = (pid: number) => capture(pid)
export const stop = start
export const releaseResources = () => undefined
const key = (row: Identity) => `${row.pid}:${row.startTime}`
export const compare = (before: Snapshot, after: Snapshot) => {
  const a = new Map(before.processes.map((row) => [key(row), row]))
  const b = new Map(after.processes.map((row) => [key(row), row]))
  const rows = [...new Set([...a.keys(), ...b.keys()])]
    .map((id) => {
      const previous = a.get(id)
      const current = b.get(id)
      return {
        ...(current ?? previous)!,
        status: !previous ? 'started' : !current ? 'exited' : 'running',
        beforePssBytes: previous?.pssBytes ?? 0,
        afterPssBytes: current?.pssBytes ?? 0,
        deltaPssBytes: (current?.pssBytes ?? 0) - (previous?.pssBytes ?? 0),
        deltaPrivateBytes: (current?.privateBytes ?? 0) - (previous?.privateBytes ?? 0),
      }
    })
    .sort((a, b) => b.deltaPssBytes - a.deltaPssBytes)
  const complete = before.errors.length === 0 && after.errors.length === 0
  return { rows, complete, snapshots: { before, after }, suspectedLeak: complete && rows.some((row) => row.deltaPssBytes >= 65536) }
}
export const isLeak = (result: ReturnType<typeof compare>) => result.suspectedLeak
export const summary = (result: ReturnType<typeof compare>) =>
  `Linux process-tree PSS growth: ${result.rows.reduce((sum, row) => sum + row.deltaPssBytes, 0)} bytes${result.complete ? '' : ' (INCOMPLETE: inspect snapshot errors)'}; growth is not proof of a leak`
