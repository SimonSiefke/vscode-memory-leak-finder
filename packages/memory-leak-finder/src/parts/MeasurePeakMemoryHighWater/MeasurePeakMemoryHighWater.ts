import { constants } from 'node:fs'
import { open, readFile, readdir, realpath, writeFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import type { Dynamic } from '../Types/Types.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import { parseStat, selectTree, type Identity } from '../MeasureLinuxProcessMemory/MeasureLinuxProcessMemory.ts'

export interface ProcessPeak extends Identity {
  readonly peakRssBytes: number
  readonly rssBytes: number
}
export interface StartProcess extends ProcessPeak {
  readonly resettable: boolean
}
export interface ProcessSnapshot<T extends ProcessPeak> {
  readonly capturedAt: string
  readonly rootPid: number
  readonly processes: readonly T[]
  readonly errors: readonly { pid: number; message: string }[]
}
export interface PeakFile {
  readonly read: () => Promise<string>
  readonly reset: () => Promise<void>
  readonly close: () => Promise<void>
}
export interface CgroupOps {
  readonly readFile: (path: string) => Promise<string>
  readonly realpath: (path: string) => Promise<string>
  readonly openPeak: (path: string, writable: boolean) => Promise<PeakFile>
}
export interface CgroupStart {
  readonly path: string
  readonly available: boolean
  readonly error: string | null
  readonly resettable: boolean
  readonly lifetimePeakChargedBytesAtStart: number | null
  readonly currentBytesAtStart: number | null
}
export interface CgroupStop {
  readonly peakChargedBytesSinceReset: number | null
  readonly lifetimePeakChargedBytes: number | null
  readonly currentBytesAtStop: number | null
}
export interface State {
  readonly pid: number
  readonly cgroupPath: string | null
  readonly procRoot: string
  readonly cgroupOps: CgroupOps
  peakFile: PeakFile | null
  cgroup: CgroupStart | null
}

const isGone = (error: Dynamic) => error.code === 'ENOENT' || error.code === 'ESRCH'
const isDenied = (error: Dynamic) => error.code === 'EACCES' || error.code === 'EPERM' || error.code === 'EROFS'

export const parseStatus = (raw: string) => {
  const value = (key: string) => {
    const match = new RegExp(`^${key}:\\s+(\\d+) kB\\s*$`, 'm').exec(raw)
    if (!match) throw new Error(`status is missing ${key}`)
    return Number(match[1]) * 1024
  }
  return { peakRssBytes: value('VmHWM'), rssBytes: value('VmRSS') }
}

const parseBytes = (raw: string) => {
  const value = raw.trim()
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error('Invalid cgroup byte counter')
  return Number(value)
}

const enumerate = async (rootPid: number, procRoot: string) => {
  const identity = async (pid: number) => parseStat(pid, await readFile(`${procRoot}/${pid}/stat`, 'utf8'))
  const root = await identity(rootPid)
  const rows: Identity[] = []
  for (const entry of await readdir(procRoot)) {
    if (!/^\d+$/.test(entry)) continue
    try {
      rows.push(await identity(Number(entry)))
    } catch (error) {
      if (!isGone(error)) throw error
    }
  }
  return { identity, root, tree: selectTree(rows, rootPid) }
}

const captureProcesses = async <T extends ProcessPeak>(
  rootPid: number,
  procRoot: string,
  read: (row: Identity) => Promise<T>,
): Promise<ProcessSnapshot<T>> => {
  const { identity, root, tree } = await enumerate(rootPid, procRoot)
  const processes: T[] = []
  const errors: { pid: number; message: string }[] = []
  for (const row of tree) {
    try {
      const result = await read(row)
      if ((await identity(row.pid)).startTime !== row.startTime) throw new Error('PID identity changed during snapshot')
      processes.push(result)
    } catch (error) {
      // A process that exits mid-capture is treated like one absent from the snapshot.
      if (!isGone(error)) errors.push({ pid: row.pid, message: error.message })
    }
  }
  const rootAfter = await identity(rootPid)
  if (root.startTime !== rootAfter.startTime || !processes.some((row) => row.pid === rootPid))
    throw new Error('Root process disappeared or changed during snapshot')
  return { capturedAt: new Date().toISOString(), rootPid, processes, errors }
}

const readPeak = async (row: Identity, procRoot: string) => ({
  ...row,
  ...parseStatus(await readFile(`${procRoot}/${row.pid}/status`, 'utf8')),
})

export const resetProcesses = (rootPid: number, procRoot = '/proc') =>
  captureProcesses<StartProcess>(rootPid, procRoot, async (row) => {
    let resettable = true
    try {
      // 5 resets the peak resident set size (VmHWM) to the current RSS.
      await writeFile(`${procRoot}/${row.pid}/clear_refs`, '5', { flag: constants.O_WRONLY })
    } catch (error) {
      if (!isDenied(error)) throw error
      resettable = false
    }
    return { ...(await readPeak(row, procRoot)), resettable }
  })

export const readProcesses = (rootPid: number, procRoot = '/proc') =>
  captureProcesses<ProcessPeak>(rootPid, procRoot, (row) => readPeak(row, procRoot))

const realPeakFile = async (path: string, writable: boolean): Promise<PeakFile> => {
  const handle = await open(path, writable ? 'r+' : 'r')
  return {
    async read() {
      const buffer = Buffer.alloc(64)
      // Reading from offset 0 regenerates the kernfs value on the same descriptor.
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
      return buffer.toString('utf8', 0, bytesRead)
    },
    async reset() {
      await handle.write('reset\n')
    },
    close: () => handle.close(),
  }
}
export const realCgroupOps: CgroupOps = {
  readFile: (path) => readFile(path, 'utf8'),
  realpath: (path) => realpath(path),
  openPeak: realPeakFile,
}

const closePeak = async (state: State) => {
  const file = state.peakFile
  state.peakFile = null
  await file?.close()
}

export const startCgroup = async (state: State): Promise<CgroupStart> => {
  await closePeak(state)
  const ops = state.cgroupOps
  const path = await ops.realpath(state.cgroupPath!)
  const procs = await ops.readFile(join(path, 'cgroup.procs'))
  if (!procs.trim().split(/\s+/).includes(String(state.pid)))
    throw new Error('Application PID is not in LINUX_CGROUP_PATH; launch it through the configured cgroup wrapper')
  const peakPath = join(path, 'memory.peak')
  let resettable = true
  let file: PeakFile
  try {
    try {
      file = await ops.openPeak(peakPath, true)
    } catch (error) {
      if (!isDenied(error)) throw error
      resettable = false
      file = await ops.openPeak(peakPath, false)
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    const unavailable = { path, available: false, error: 'memory.peak is unavailable', resettable: false }
    return { ...unavailable, lifetimePeakChargedBytesAtStart: null, currentBytesAtStart: null }
  }
  state.peakFile = file
  const lifetimePeakChargedBytesAtStart = parseBytes(await file.read())
  if (resettable) {
    try {
      // The reset is per descriptor, so this one descriptor stays open until stop.
      await file.reset()
    } catch (error) {
      if (!isDenied(error) && error.code !== 'EINVAL') throw error
      resettable = false
    }
  }
  const currentBytesAtStart = parseBytes(await ops.readFile(join(path, 'memory.current')))
  return { path, available: true, error: null, resettable, lifetimePeakChargedBytesAtStart, currentBytesAtStart }
}

const emptyCgroupStop: CgroupStop = { peakChargedBytesSinceReset: null, lifetimePeakChargedBytes: null, currentBytesAtStop: null }
export const stopCgroup = async (state: State): Promise<CgroupStop> => {
  const file = state.peakFile
  const cgroup = state.cgroup
  if (!file || !cgroup) return emptyCgroupStop
  const currentBytesAtStop = parseBytes(await state.cgroupOps.readFile(join(cgroup.path, 'memory.current')))
  const ownPeak = parseBytes(await file.read())
  // A descriptor without a reset reports the cgroup lifetime peak and does not disturb the reset one.
  const lifetimePeakChargedBytes = cgroup.resettable
    ? parseBytes(await state.cgroupOps.readFile(join(cgroup.path, 'memory.peak')))
    : ownPeak
  return { peakChargedBytesSinceReset: cgroup.resettable ? ownPeak : null, lifetimePeakChargedBytes, currentBytesAtStop }
}

export const id = MeasureId.PeakMemoryHighWater
export const targets: readonly Dynamic[] = []
export const create = ({ pid }: { pid: number }, procRoot = '/proc', cgroupOps: CgroupOps = realCgroupOps) => {
  if (process.platform !== 'linux') throw new Error('peak-memory-high-water requires Linux')
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('peak-memory-high-water requires a root PID')
  const cgroupPath = process.env.LINUX_CGROUP_PATH || null
  if (cgroupPath && !isAbsolute(cgroupPath)) throw new Error('LINUX_CGROUP_PATH must be an absolute cgroup v2 directory')
  return [{ pid, cgroupPath, procRoot, cgroupOps, peakFile: null, cgroup: null } satisfies State]
}
export const releaseResources = async (state: State) => {
  state.cgroup = null
  await closePeak(state)
}
export const start = async (state: State) => {
  state.cgroup = state.cgroupPath ? await startCgroup(state) : null
  try {
    return { ...(await resetProcesses(state.pid, state.procRoot)), cgroup: state.cgroup }
  } catch (error) {
    await releaseResources(state)
    throw error
  }
}
export const stop = async (state: State) => {
  // Read the cgroup first so the process scan is not charged to the window it reports.
  const cgroup = await stopCgroup(state)
  return { ...(await readProcesses(state.pid, state.procRoot)), cgroup }
}

type Before = Awaited<ReturnType<typeof start>>
type After = Awaited<ReturnType<typeof stop>>
const key = (row: Identity) => `${row.pid}:${row.startTime}`

export const compareCgroup = (before: CgroupStart | null, after: CgroupStop | null) => {
  if (!before) return null
  const merged = { ...before, ...(after ?? emptyCgroupStop) }
  const { peakChargedBytesSinceReset: peak, currentBytesAtStart, currentBytesAtStop, lifetimePeakChargedBytes } = merged
  const consistent =
    peak === null || currentBytesAtStart === null || currentBytesAtStop === null || lifetimePeakChargedBytes === null
      ? null
      : peak >= currentBytesAtStart && peak >= currentBytesAtStop && peak <= lifetimePeakChargedBytes
  return { ...merged, consistent }
}

export const compare = (before: Before, after: After) => {
  const a = new Map(before.processes.map((row) => [key(row), row]))
  const b = new Map(after.processes.map((row) => [key(row), row]))
  const rows = [...new Set([...a.keys(), ...b.keys()])]
    .map((id) => {
      const previous = a.get(id)
      const current = b.get(id)
      const { pid, parentPid, startTime, name } = (current ?? previous)!
      const window = !current ? null : !previous ? 'process-lifetime' : previous.resettable ? 'since-reset' : 'lifetime-unreset'
      return {
        pid,
        parentPid,
        startTime,
        name,
        status: !previous ? 'started' : !current ? 'exited' : 'running',
        window,
        resettable: previous?.resettable ?? null,
        peakRssBytes: current?.peakRssBytes ?? null,
        rssAtResetBytes: previous?.rssBytes ?? null,
        rssAtStopBytes: current?.rssBytes ?? null,
      }
    })
    .sort((x, y) => (y.peakRssBytes ?? -1) - (x.peakRssBytes ?? -1))
  // Per-process RSS peaks are not simultaneous and double-count shared pages, so they are never summed.
  const windowed = rows.filter((row) => row.window === 'since-reset' || row.window === 'process-lifetime')
  const largest = windowed[0]
  return {
    rows,
    largestProcessPeakRssBytes: largest?.peakRssBytes ?? null,
    largestProcessPeakPid: largest?.pid ?? null,
    largestProcessPeakName: largest?.name ?? null,
    complete: before.errors.length === 0 && after.errors.length === 0 && rows.every((row) => row.window !== 'lifetime-unreset'),
    cgroup: compareCgroup(before.cgroup, after.cgroup),
    snapshots: { before, after },
  }
}
export const isLeak = () => false
const mib = (bytes: number | null) => (bytes === null ? 'n/a' : `${(bytes / 1024 / 1024).toFixed(1)} MiB`)
export const summary = (result: ReturnType<typeof compare>) =>
  `Largest per-process RSS high-water mark: ${mib(result.largestProcessPeakRssBytes)}` +
  (result.largestProcessPeakName ? ` (${result.largestProcessPeakName}, PID ${result.largestProcessPeakPid})` : '') +
  (result.cgroup ? `; cgroup charged peak since reset: ${mib(result.cgroup.peakChargedBytesSinceReset)}` : '') +
  (result.complete ? '' : ' (INCOMPLETE: inspect resettable flags and snapshot errors)') +
  '; peaks are informational, not a leak signal'
