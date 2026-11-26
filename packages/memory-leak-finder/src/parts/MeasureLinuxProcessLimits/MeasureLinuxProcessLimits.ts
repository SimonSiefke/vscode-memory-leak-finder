import { readFile, readdir, readlink } from 'node:fs/promises'
import type { Dynamic } from '../Types/Types.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import { parseStat, selectTree, type Identity } from '../MeasureLinuxProcessMemory/MeasureLinuxProcessMemory.ts'

export interface LimitsRow extends Identity {
  readonly threads: number
  readonly vmSizeBytes: number
  readonly vmPeakBytes: number
  // null when the process' fd or fdinfo entries could not be read.
  readonly inotifyInstances: number | null
  readonly inotifyWatches: number | null
}
export interface SystemLimits {
  readonly maxUserWatches: number | null
  readonly maxUserInstances: number | null
  readonly threadsMax: number | null
}
export interface Snapshot {
  readonly capturedAt: string
  readonly rootPid: number
  readonly processes: readonly LimitsRow[]
  readonly limits: SystemLimits
  readonly errors: readonly { pid: number; message: string }[]
}
export interface Totals {
  readonly threads: number
  readonly inotifyInstances: number | null
  readonly inotifyWatches: number | null
}

const isGone = (error: any) => error.code === 'ENOENT' || error.code === 'ESRCH'

export const parseStatus = (raw: string) => {
  const fields = new Map<string, string>()
  for (const line of raw.split('\n')) {
    const index = line.indexOf(':')
    if (index > 0) fields.set(line.slice(0, index), line.slice(index + 1).trim())
  }
  const kiloBytes = (key: string) => {
    const match = /^(\d+) kB$/.exec(fields.get(key) ?? '')
    if (!match) throw new Error(`status is missing ${key}`)
    return Number(match[1]) * 1024
  }
  const threads = fields.get('Threads') ?? ''
  if (!/^\d+$/.test(threads)) throw new Error('status is missing Threads')
  return { threads: Number(threads), vmSizeBytes: kiloBytes('VmSize'), vmPeakBytes: kiloBytes('VmPeak') }
}

export const countInotifyWatches = (fdinfo: string) => fdinfo.split('\n').filter((line) => line.startsWith('inotify wd:')).length

const readInotify = async (fdRoot: string) => {
  let instances = 0
  let watches = 0
  for (const fd of await readdir(`${fdRoot}/fd`)) {
    let link: string
    try {
      link = await readlink(`${fdRoot}/fd/${fd}`)
    } catch (error) {
      if (isGone(error)) continue // closed during the scan
      throw error
    }
    if (link !== 'anon_inode:inotify') continue
    let fdinfo: string
    try {
      fdinfo = await readFile(`${fdRoot}/fdinfo/${fd}`, 'utf8')
    } catch (error) {
      if (isGone(error)) continue
      throw error
    }
    instances++
    watches += countInotifyWatches(fdinfo)
  }
  return { inotifyInstances: instances, inotifyWatches: watches }
}

const readLimit = async (path: string) => {
  try {
    const value = (await readFile(path, 'utf8')).trim()
    return /^\d+$/.test(value) ? Number(value) : null
  } catch {
    return null
  }
}

export const readSystemLimits = async (procRoot = '/proc'): Promise<SystemLimits> => ({
  maxUserWatches: await readLimit(`${procRoot}/sys/fs/inotify/max_user_watches`),
  maxUserInstances: await readLimit(`${procRoot}/sys/fs/inotify/max_user_instances`),
  threadsMax: await readLimit(`${procRoot}/sys/kernel/threads-max`),
})

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
      if (!isGone(error)) throw error
    }
  }
  const processes: LimitsRow[] = []
  for (const row of selectTree(rows, rootPid)) {
    try {
      const status = parseStatus(await readFile(`${procRoot}/${row.pid}/status`, 'utf8'))
      let inotify: { inotifyInstances: number | null; inotifyWatches: number | null }
      try {
        inotify = await readInotify(`${procRoot}/${row.pid}`)
      } catch (error) {
        // Keep the thread and address-space data, but mark the inotify counts as unknown.
        inotify = { inotifyInstances: null, inotifyWatches: null }
        errors.push({ pid: row.pid, message: `inotify: ${error.message}` })
      }
      const after = await identity(row.pid)
      if (after.startTime !== row.startTime) throw new Error('PID identity changed during snapshot')
      processes.push({ ...row, ...status, ...inotify })
    } catch (error) {
      errors.push({ pid: row.pid, message: error.message })
    }
  }
  const rootAfter = await identity(rootPid)
  if (root.startTime !== rootAfter.startTime || !processes.some((row) => row.pid === rootPid))
    throw new Error('Root process disappeared or changed during snapshot')
  return { capturedAt: new Date().toISOString(), rootPid, processes, limits: await readSystemLimits(procRoot), errors }
}

const sum = (values: readonly (number | null)[]) =>
  values.includes(null) ? null : values.reduce<number>((total, value) => total + value!, 0)
const difference = (after: number | null, before: number | null) => (after === null || before === null ? null : after - before)
export const totals = (snapshot: Snapshot): Totals => ({
  threads: snapshot.processes.reduce((total, row) => total + row.threads, 0),
  inotifyInstances: sum(snapshot.processes.map((row) => row.inotifyInstances)),
  inotifyWatches: sum(snapshot.processes.map((row) => row.inotifyWatches)),
})
const gib = (bytes: number) => `${(bytes / 2 ** 30).toFixed(2)} GiB`
// Allocator arenas and thread stacks move VmSize by megabytes; a WebAssembly.Memory reservation is about 8 GiB.
export const vmSizeGrowthThresholdBytes = 2 ** 30

export const id = MeasureId.LinuxProcessLimits
export const targets: readonly Dynamic[] = []
export const create = ({ pid }: { pid: number }) => {
  if (process.platform !== 'linux') throw new Error('linux-process-limits requires Linux')
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('linux-process-limits requires a root PID')
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
      const row = (current ?? previous)!
      return {
        pid: row.pid,
        parentPid: row.parentPid,
        startTime: row.startTime,
        name: row.name,
        status: !previous ? 'started' : !current ? 'exited' : 'running',
        beforeThreads: previous?.threads ?? 0,
        afterThreads: current?.threads ?? 0,
        deltaThreads: (current?.threads ?? 0) - (previous?.threads ?? 0),
        beforeVmSizeBytes: previous?.vmSizeBytes ?? 0,
        afterVmSizeBytes: current?.vmSizeBytes ?? 0,
        deltaVmSizeBytes: (current?.vmSizeBytes ?? 0) - (previous?.vmSizeBytes ?? 0),
        vmPeakBytes: row.vmPeakBytes,
        deltaInotifyInstances: difference(current ? current.inotifyInstances : 0, previous ? previous.inotifyInstances : 0),
        deltaInotifyWatches: difference(current ? current.inotifyWatches : 0, previous ? previous.inotifyWatches : 0),
      }
    })
    .sort(
      (a, b) =>
        b.deltaThreads - a.deltaThreads ||
        (b.deltaInotifyWatches ?? 0) - (a.deltaInotifyWatches ?? 0) ||
        b.deltaVmSizeBytes - a.deltaVmSizeBytes,
    )
  const beforeTotals = totals(before)
  const afterTotals = totals(after)
  const deltaTotals: Totals = {
    threads: afterTotals.threads - beforeTotals.threads,
    inotifyInstances: difference(afterTotals.inotifyInstances, beforeTotals.inotifyInstances),
    inotifyWatches: difference(afterTotals.inotifyWatches, beforeTotals.inotifyWatches),
  }
  // Virtual sizes overlap heavily with reservations and are not additive, so only per-process growth is reported.
  const running = rows.filter((row) => row.status === 'running')
  const largestVmSizeDeltaBytes = running.length === 0 ? null : Math.max(...running.map((row) => row.deltaVmSizeBytes))
  const growth = [
    ...(['threads', 'inotifyInstances', 'inotifyWatches'] as const).filter((metric) => (deltaTotals[metric] ?? 0) > 0),
    ...(largestVmSizeDeltaBytes !== null && largestVmSizeDeltaBytes >= vmSizeGrowthThresholdBytes ? ['vmSize'] : []),
  ]
  const complete = before.errors.length === 0 && after.errors.length === 0
  return {
    complete,
    totals: { before: beforeTotals, after: afterTotals, delta: deltaTotals },
    largestVmSizeDeltaBytes,
    limits: after.limits,
    growth,
    rows,
    snapshots: { before, after },
  }
}
export const isLeak = () => false
export const summary = (result: ReturnType<typeof compare>) => {
  const { delta, after } = result.totals
  const signed = (value: number | null) => (value === null ? 'unknown' : `${value >= 0 ? '+' : ''}${value}`)
  const watches = `${signed(delta.inotifyWatches)} (${after.inotifyWatches ?? 'unknown'} of max_user_watches ${result.limits.maxUserWatches ?? 'unknown'})`
  const vmSize = result.largestVmSizeDeltaBytes === null ? 'unknown' : gib(result.largestVmSizeDeltaBytes)
  return `Linux process-tree limits: threads ${signed(delta.threads)}, inotify instances ${signed(delta.inotifyInstances)}, inotify watches ${watches}, largest VmSize growth ${vmSize}${result.complete ? '' : ' (INCOMPLETE: inspect snapshot errors)'}; growth is not proof of a leak`
}
