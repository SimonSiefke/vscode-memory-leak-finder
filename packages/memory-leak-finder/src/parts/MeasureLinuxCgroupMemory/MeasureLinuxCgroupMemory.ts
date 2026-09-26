import { readFile, realpath, stat } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import type { Dynamic } from '../Types/Types.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

interface State {
  readonly path: string
  readonly pid: number
}
export const parseStat = (raw: string): Record<string, number> => {
  const fields: Record<string, number> = Object.create(null)
  for (const line of raw.trim().split('\n')) {
    const match = /^(\w+) (\d+)$/.exec(line.trim())
    if (!match || !Number.isSafeInteger(Number(match[2]))) throw new Error(`Invalid memory.stat row: ${line}`)
    fields[match[1]] = Number(match[2])
  }
  if (!('anon' in fields) || !('file' in fields)) throw new Error('memory.stat must contain anon and file')
  return fields
}
const parseBytes = (raw: string) => {
  const value = raw.trim()
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error('Invalid cgroup byte counter')
  return Number(value)
}
export const id = MeasureId.LinuxCgroupMemory
export const targets: readonly Dynamic[] = []
export const create = ({ pid }: { pid: number }) => {
  if (process.platform !== 'linux') throw new Error('linux-cgroup-memory requires Linux')
  const path = process.env.LINUX_CGROUP_PATH
  if (!path || !isAbsolute(path))
    throw new Error('Set LINUX_CGROUP_PATH to an empty, writable, dedicated cgroup v2 directory before launching')
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('linux-cgroup-memory requires the application PID')
  return [{ path, pid } satisfies State]
}
export const capture = async (state: State) => {
  const path = await realpath(state.path)
  const identity = await stat(path, { bigint: true })
  const [current, rawStat, procs] = await Promise.all([
    readFile(join(path, 'memory.current'), 'utf8'),
    readFile(join(path, 'memory.stat'), 'utf8'),
    readFile(join(path, 'cgroup.procs'), 'utf8'),
  ])
  if (!procs.trim().split(/\s+/).includes(String(state.pid)))
    throw new Error('Application PID is not in LINUX_CGROUP_PATH; launch it through the configured cgroup wrapper')
  // Swap accounting can be unavailable when disabled in the kernel.
  let swapBytes: number | null = null
  try {
    swapBytes = parseBytes(await readFile(join(path, 'memory.swap.current'), 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const after = await stat(path, { bigint: true })
  if (identity.ino !== after.ino || identity.dev !== after.dev) throw new Error('Cgroup changed during capture')
  return {
    capturedAt: new Date().toISOString(),
    path,
    identity: `${identity.dev}:${identity.ino}`,
    currentBytes: parseBytes(current),
    swapBytes,
    stats: parseStat(rawStat),
    rawStat,
  }
}
export const start = capture
export const stop = capture
export const releaseResources = () => undefined
export const compare = (before: Awaited<ReturnType<typeof capture>>, after: Awaited<ReturnType<typeof capture>>) => {
  if (before.path !== after.path || before.identity !== after.identity) throw new Error('Cannot compare different cgroups')
  const stats = [...new Set([...Object.keys(before.stats), ...Object.keys(after.stats)])].map((name) => ({
    name,
    before: before.stats[name] ?? null,
    after: after.stats[name] ?? null,
    delta: name in before.stats && name in after.stats ? after.stats[name] - before.stats[name] : null,
  }))
  const deltaBytes = after.currentBytes - before.currentBytes
  return {
    deltaBytes,
    stats,
    snapshots: { before, after },
    deltaSwapBytes: before.swapBytes === null || after.swapBytes === null ? null : after.swapBytes - before.swapBytes,
    suspectedLeak: deltaBytes >= 65536,
  }
}
export const isLeak = (result: ReturnType<typeof compare>) => result.suspectedLeak
export const summary = (result: ReturnType<typeof compare>) =>
  `Linux cgroup charged-memory growth: ${result.deltaBytes} bytes (growth is not proof of a leak)`
