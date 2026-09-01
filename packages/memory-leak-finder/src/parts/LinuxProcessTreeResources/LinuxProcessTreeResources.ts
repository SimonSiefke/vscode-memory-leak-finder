import { readdir, readFile } from 'node:fs/promises'

export const PssSampleIntervalMs = 250

export const PerfEvents = [
  'duration_time',
  'user_time',
  'system_time',
  'task-clock',
  'instructions:u',
  'cycles:u',
  'context-switches',
  'cpu-migrations',
  'page-faults',
  'minor-faults',
  'major-faults',
] as const

export interface ProcessIdentity {
  readonly parentPid: number
  readonly pid: number
  readonly startTimeTicks: string
}

export interface ProcessTreeSample {
  readonly processCount: number
  readonly pssKiB: number
  readonly timestamp: number
  readonly type: 'sample'
}

export interface ProcessTreeSamplerResult {
  readonly droppedSampleCount: number
  readonly samples: readonly ProcessTreeSample[]
}

interface ProcessTreeSampler {
  start(): Promise<ProcessTreeSample>
  stop(): Promise<ProcessTreeSamplerResult>
}

interface SamplerDependencies {
  readonly getProcessTable?: () => Promise<ReadonlyMap<number, ProcessIdentity>>
  readonly now?: () => number
  readonly readPssKiB?: (pid: number) => Promise<number>
}

interface PerfCounters {
  readonly averageCpuCores: number
  readonly contextSwitches: number
  readonly cpuMigrations: number
  readonly cycles: number
  readonly durationSeconds: number
  readonly instructions: number
  readonly instructionsPerCycle: number
  readonly majorPageFaults: number
  readonly minorPageFaults: number
  readonly pageFaults: number
  readonly systemTimeSeconds: number
  readonly taskClockSeconds: number
  readonly userTimeSeconds: number
}

const normalizePerfEvent = (event: string): string => {
  return event.trim().split(':')[0]
}

const requiredPerfEvents = PerfEvents.map(normalizePerfEvent)

const parsePerfValue = (value: string): number | undefined => {
  const normalized = value.trim()
  if (!normalized || normalized.startsWith('<')) {
    return undefined
  }
  const parsed = Number(normalized.replaceAll(',', ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

export const parsePerfStatOutput = (rawOutput: string): PerfCounters => {
  if (/no permission|permission error|perf_event_paranoid/i.test(rawOutput)) {
    throw new Error('perf cannot access the required counters; check /proc/sys/kernel/perf_event_paranoid and the process perf permissions')
  }
  const counters: Record<string, number> = Object.create(null)
  const unsupported = new Set<string>()
  for (const line of rawOutput.split('\n')) {
    const parts = line.split(',')
    const eventIndex = parts.findIndex((part) => requiredPerfEvents.includes(normalizePerfEvent(part)))
    if (eventIndex < 2) {
      continue
    }
    const event = normalizePerfEvent(parts[eventIndex])
    const value = parsePerfValue(parts[eventIndex - 2])
    if (value === undefined) {
      if (parts[eventIndex - 2].includes('<not supported>')) {
        unsupported.add(event)
      }
      continue
    }
    const unit = parts[eventIndex - 1].trim()
    const normalizedValue = event === 'task-clock' && unit === 'msec' ? value / 1000 : value
    counters[event] = (counters[event] || 0) + normalizedValue
  }
  const unavailable = requiredPerfEvents.filter((event) => counters[event] === undefined)
  if (unavailable.length > 0) {
    const unsupportedEvents = unavailable.filter((event) => unsupported.has(event))
    if (unsupportedEvents.length > 0) {
      throw new Error(`Required perf counters are unsupported on this system: ${unsupportedEvents.join(', ')}`)
    }
    throw new Error(
      `Required perf counters were not counted: ${unavailable.join(', ')}; check perf permissions and whether the measured processes exited`,
    )
  }
  const durationSeconds = counters.duration_time / 1_000_000_000
  const userTimeSeconds = counters.user_time / 1_000_000_000
  const systemTimeSeconds = counters.system_time / 1_000_000_000
  const taskClockSeconds = counters['task-clock']
  const instructions = counters.instructions
  const cycles = counters.cycles
  return {
    averageCpuCores: durationSeconds === 0 ? 0 : taskClockSeconds / durationSeconds,
    contextSwitches: counters['context-switches'],
    cpuMigrations: counters['cpu-migrations'],
    cycles,
    durationSeconds,
    instructions,
    instructionsPerCycle: cycles === 0 ? 0 : instructions / cycles,
    majorPageFaults: counters['major-faults'],
    minorPageFaults: counters['minor-faults'],
    pageFaults: counters['page-faults'],
    systemTimeSeconds,
    taskClockSeconds,
    userTimeSeconds,
  }
}

export const parseProcessStat = (text: string): ProcessIdentity => {
  const closeParenIndex = text.lastIndexOf(')')
  if (closeParenIndex === -1) {
    throw new Error('Invalid /proc process stat')
  }
  const pid = Number(text.slice(0, text.indexOf(' ')))
  const fields = text
    .slice(closeParenIndex + 2)
    .trim()
    .split(/\s+/)
  const parentPid = Number(fields[1])
  const startTimeTicks = fields[19]
  if (!Number.isFinite(pid) || !Number.isFinite(parentPid) || !startTimeTicks) {
    throw new Error('Invalid /proc process stat')
  }
  return {
    parentPid,
    pid,
    startTimeTicks,
  }
}

export const getProcessTable = async (procRoot = '/proc'): Promise<ReadonlyMap<number, ProcessIdentity>> => {
  let entries
  try {
    entries = await readdir(procRoot, { withFileTypes: true })
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error.code === 'EACCES' || error.code === 'ENOENT' || error.code === 'EPERM')) {
      throw new Error(`Linux process-tree resource measures require a readable ${procRoot} filesystem`)
    }
    throw error
  }
  const table = new Map<number, ProcessIdentity>()
  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory() || !/^\d+$/.test(entry.name)) {
        return
      }
      try {
        const identity = parseProcessStat(await readFile(`${procRoot}/${entry.name}/stat`, 'utf8'))
        table.set(identity.pid, identity)
      } catch {
        // The process exited while /proc was being inspected.
      }
    }),
  )
  return table
}

const sameIdentity = (first: ProcessIdentity, second: ProcessIdentity): boolean => {
  return first.pid === second.pid && first.startTimeTicks === second.startTimeTicks
}

export const updateTrackedProcesses = (
  rootPid: number,
  previous: ReadonlyMap<number, ProcessIdentity>,
  table: ReadonlyMap<number, ProcessIdentity>,
): ReadonlyMap<number, ProcessIdentity> => {
  const selected = new Map<number, ProcessIdentity>()
  const root = table.get(rootPid)
  if (root) {
    selected.set(root.pid, root)
  }
  for (const identity of previous.values()) {
    const current = table.get(identity.pid)
    if (current && sameIdentity(identity, current)) {
      selected.set(current.pid, current)
    }
  }
  let changed = true
  while (changed) {
    changed = false
    for (const identity of table.values()) {
      if (!selected.has(identity.pid) && selected.has(identity.parentPid)) {
        selected.set(identity.pid, identity)
        changed = true
      }
    }
  }
  return selected
}

export const parseSmapsRollupPssKiB = (text: string): number => {
  const match = /^Pss:\s+(\d+)\s+kB$/m.exec(text)
  if (!match) {
    throw new Error('Pss is missing from smaps_rollup')
  }
  return Number(match[1])
}

export const readProcessPssKiB = async (pid: number, procRoot = '/proc'): Promise<number> => {
  const path = `${procRoot}/${pid}/smaps_rollup`
  try {
    return parseSmapsRollupPssKiB(await readFile(path, 'utf8'))
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error.code === 'EACCES' || error.code === 'EPERM')) {
      throw new Error(`Cannot read ${path}; Linux process-tree resource measures require permission to read smaps_rollup`)
    }
    throw error
  }
}

const isTransientProcError = (error: unknown): boolean => {
  return error instanceof Error && 'code' in error && (error.code === 'ENOENT' || error.code === 'ESRCH')
}

export const createProcessTreeSampler = (
  rootPid: number,
  { getProcessTable: getTable = getProcessTable, now = Date.now, readPssKiB = readProcessPssKiB }: SamplerDependencies = {},
  { excludeRoot = false, intervalMs = PssSampleIntervalMs }: { excludeRoot?: boolean; intervalMs?: number } = {},
): ProcessTreeSampler => {
  let droppedSampleCount = 0
  let fatalError: unknown
  let inFlight: Promise<void> | undefined
  let stopped = false
  let timer: NodeJS.Timeout | undefined
  let tracked: ReadonlyMap<number, ProcessIdentity> = new Map<number, ProcessIdentity>()
  const samples: ProcessTreeSample[] = []
  let stopPromise: Promise<ProcessTreeSamplerResult> | undefined

  const takeSample = async (): Promise<ProcessTreeSample | undefined> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const table = await getTable()
        const nextTracked = updateTrackedProcesses(rootPid, tracked, table)
        const identities = [...nextTracked.values()].filter((identity) => !excludeRoot || identity.pid !== rootPid)
        if (identities.length === 0) {
          throw new Error(`No processes found for process-tree root ${rootPid}`)
        }
        const values = await Promise.all(identities.map((identity) => readPssKiB(identity.pid)))
        const validationTable = await getTable()
        if (
          identities.some((identity) => !validationTable.get(identity.pid) || !sameIdentity(identity, validationTable.get(identity.pid)!))
        ) {
          continue
        }
        tracked = nextTracked
        const sample: ProcessTreeSample = {
          processCount: identities.length,
          pssKiB: values.reduce((total, value) => total + value, 0),
          timestamp: now(),
          type: 'sample',
        }
        samples.push(sample)
        return sample
      } catch (error) {
        if (!isTransientProcError(error)) {
          throw error
        }
      }
    }
    droppedSampleCount++
    return undefined
  }

  const schedule = (): void => {
    if (stopped) {
      return
    }
    timer = setTimeout(() => {
      inFlight = takeSample()
        .then(() => {})
        .catch((error) => {
          fatalError = error
          stopped = true
        })
        .finally(() => {
          inFlight = undefined
          schedule()
        })
    }, intervalMs)
  }

  return {
    async start() {
      const first = await takeSample()
      if (!first) {
        throw new Error(`Unable to take an initial process-tree PSS sample for ${rootPid}`)
      }
      schedule()
      return first
    },
    async stop() {
      stopPromise ||= (async () => {
        stopped = true
        if (timer) {
          clearTimeout(timer)
        }
        if (inFlight) {
          await inFlight
        }
        if (fatalError) {
          throw fatalError
        }
        const finalSample = await takeSample()
        if (!finalSample && samples.length === 0) {
          throw new Error(`Unable to take a process-tree PSS sample for ${rootPid}`)
        }
        return {
          droppedSampleCount,
          samples,
        }
      })()
      return stopPromise
    },
  }
}
