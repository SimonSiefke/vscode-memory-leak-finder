import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import type { Session } from '../../memory-leak-finder/src/parts/Session/Session.ts'
import type { ElectronContext } from './types.ts'

// Reuse the existing process-tree, PID-identity, smaps, and MemoryInfra parsers.
const linuxUrl = new URL('../../memory-leak-finder/src/parts/MeasureLinuxProcessMemory/MeasureLinuxProcessMemory.ts', import.meta.url).href
const dumpUrl = new URL('../../chromium-memory-dump-worker/src/parts/ChromiumMemoryDump/ChromiumMemoryDump.ts', import.meta.url).href
const linux = await import(linuxUrl)
const { getDetailedDumpSnapshots } = await import(dumpUrl)

type ProcessRole = 'main' | 'gpu' | 'renderer' | 'utility' | 'other'
interface Footprint {
  readonly pssBytes: number
  readonly rssBytes: number
  readonly privateBytes: number
}
interface ProcessSample extends Footprint {
  readonly pid: number
  readonly startTime: string
  readonly role: ProcessRole
}
interface Allocator {
  readonly path: string
  readonly pid: number
  readonly processName: string
  readonly sizeBytes: number | null
}

export const summarizeAllocators = (allocators: readonly Allocator[], rootPid: number) => {
  const malloc = allocators.filter((row) => row.path === 'malloc/allocated_objects')
  const graphics = allocators.filter((row) => /^(gpu|skia|discardable)(\/|$)/.test(row.path))
  const gpuRoots = graphics.filter((row) => row.path === 'gpu' && /gpu/i.test(row.processName))
  // Only root sizes are totals. Summing allocator parents and children would double count.
  const gpuBytes =
    gpuRoots.length && gpuRoots.every((row) => row.sizeBytes !== null) ? gpuRoots.reduce((sum, row) => sum + row.sizeBytes!, 0) : null
  return {
    mainMallocBytes: malloc.find((row) => row.pid === rootPid)?.sizeBytes ?? null,
    gpuBytes,
    malloc,
    graphics,
  }
}

const roleFor = (pid: number, rootPid: number, command: string): ProcessRole => {
  if (pid === rootPid) return 'main'
  if (command.includes('--type=gpu-process')) return 'gpu'
  if (command.includes('--type=renderer')) return 'renderer'
  if (command.includes('--type=utility')) return 'utility'
  return 'other'
}

export const measureNativeMemory = async (
  rpc: Session,
  context: ElectronContext,
  runs: number,
  run: () => Promise<void>,
  artifactsPath: string,
  collectTraces = true,
  traceInterval = 37,
) => {
  if (process.platform !== 'linux') throw new Error('native-memory currently requires Linux /proc/smaps_rollup')
  let complete = true
  const samples: unknown[] = []
  const checkpoints: unknown[] = []
  const known = new Map<number, string>()
  const discover = async () => {
    const tree = await linux.capture(context.pid)
    for (const row of tree.processes) known.set(row.pid, row.startTime)
    return tree
  }
  const metadata = await context.evaluate('globalThis.electronE2E.memoryEnvironment()')
  const trace = async (label: string) => {
    if (!collectTraces) return { path: '', dumpCount: 0, dumpId: '', ...summarizeAllocators([], context.pid) }
    const path = join(artifactsPath, `${label}.native-trace.json`)
    await context.evaluate(`globalThis.electronE2E.captureNativeMemoryTrace(${JSON.stringify(path)})`)
    const capture = JSON.parse(await readFile(path, 'utf8'))
    const dumps = getDetailedDumpSnapshots(capture.traceEvents)
    const complete = dumps.filter((dump: { allocators: Allocator[] }) =>
      dump.allocators.some((row) => row.pid === context.pid && row.path === 'malloc/allocated_objects' && row.sizeBytes !== null),
    )
    if (!complete.length) throw new Error('Native trace contains no main-process live malloc counters')
    const last = complete.at(-1)!
    return { path, dumpCount: dumps.length, dumpId: last.id, ...summarizeAllocators(last.allocators, context.pid) }
  }
  // Prime tracing service/buffers before baseline; no periodic trace is left active.
  await trace('instrumentation-warmup')
  await discover()
  const sample = async (cycle: number, phase = 'cycle') => {
    await rpc.invoke('HeapProfiler.collectGarbage')
    const runtime = (await context.evaluate('globalThis.electronE2E.memoryProcesses()')) as {
      main: { rss: number; heapUsed: number; heapTotal: number; external: number; arrayBuffers: number }
      processes: { pid: number }[]
    }
    for (const row of runtime.processes) {
      if (!known.has(row.pid)) {
        try {
          known.set(row.pid, linux.parseStat(row.pid, await readFile(`/proc/${row.pid}/stat`, 'utf8')).startTime)
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
        }
      }
    }
    const processes: ProcessSample[] = []
    const errors: { pid: number; message: string }[] = []
    await Promise.all(
      [...known].map(async ([pid, startTime]) => {
        try {
          const stat = linux.parseStat(pid, await readFile(`/proc/${pid}/stat`, 'utf8'))
          if (stat.startTime !== startTime) {
            known.delete(pid)
            throw new Error('PID identity changed')
          }
          const memory = linux.parseSmaps(await readFile(`/proc/${pid}/smaps_rollup`, 'utf8'))
          const command = await readFile(`/proc/${pid}/cmdline`, 'utf8')
          const after = linux.parseStat(pid, await readFile(`/proc/${pid}/stat`, 'utf8'))
          if (after.startTime !== startTime) throw new Error('PID identity changed during sample')
          processes.push({ pid, startTime, role: roleFor(pid, context.pid, command), ...memory })
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT' || (error as NodeJS.ErrnoException).code === 'ESRCH') known.delete(pid)
          else errors.push({ pid, message: String(error) })
        }
      }),
    )
    if (!processes.some((row) => row.pid === context.pid)) throw new Error('Main process disappeared during native measurement')
    const totals = processes.reduce(
      (sum, row) => ({
        pssBytes: sum.pssBytes + row.pssBytes,
        rssBytes: sum.rssBytes + row.rssBytes,
        privateBytes: sum.privateBytes + row.privateBytes,
      }),
      { pssBytes: 0, rssBytes: 0, privateBytes: 0 },
    )
    const result = { cycle, phase, processes: processes.sort((a, b) => a.pid - b.pid), totals, mainRuntime: runtime.main, errors }
    if (errors.length) complete = false
    samples.push(result)
    return result
  }
  const checkpoint = async (cycle: number, phase = 'cycle') => {
    await rpc.invoke('HeapProfiler.collectGarbage')
    const tree = await discover()
    const native = await trace(`${phase}-${cycle}`)
    if (tree.errors.length) complete = false
    checkpoints.push({ cycle, treeErrors: tree.errors, ...native })
  }
  await checkpoint(0)
  const before = await sample(0)
  for (let cycle = 1; cycle <= runs; cycle++) {
    await run()
    if (cycle % traceInterval === 0 || cycle === runs) await checkpoint(cycle)
    await sample(cycle)
  }
  // Observe delayed resource retirement and allocator retention without further operations.
  for (let second = 1; second <= 5; second++) {
    await delay(1000)
    await sample(runs, `idle-${second}s`)
  }
  await checkpoint(runs, 'idle')
  const after = await sample(runs, 'final-idle')
  return { nativeMemory: { complete, tracesEnabled: collectTraces, environment: metadata, before, after, samples, checkpoints } }
}
