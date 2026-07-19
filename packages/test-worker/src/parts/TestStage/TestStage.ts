import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

interface PerformanceMark {
  readonly name: string
  readonly startTime: number
}

interface ProcessManifestEntry {
  readonly args: string
  readonly pid: number
  readonly ppid: number
}

const processManifests = new WeakMap<object, readonly ProcessManifestEntry[]>()

export const getProcessManifestFromSnapshot = (value: string, userDataPath: string): readonly ProcessManifestEntry[] => {
  const entries: ProcessManifestEntry[] = []
  for (const line of value.split('\n')) {
    const match = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line)
    if (match) {
      entries.push({
        args: match[3],
        pid: Number(match[1]),
        ppid: Number(match[2]),
      })
    }
  }
  const included = new Set(entries.filter(({ args }) => args.includes(userDataPath)).map(({ pid }) => pid))
  let changed = true
  while (changed) {
    changed = false
    for (const entry of entries) {
      if (included.has(entry.ppid) && !included.has(entry.pid)) {
        included.add(entry.pid)
        changed = true
      }
    }
  }
  return entries.filter(({ pid }) => included.has(pid))
}

const getPerformanceProcessManifest = async (): Promise<readonly ProcessManifestEntry[]> => {
  const userDataPath = process.env.VSCODE_PERFORMANCE_USER_DATA_DIR
  if (!userDataPath || process.platform !== 'linux') {
    return []
  }
  const { stdout } = await execFileAsync('ps', ['-eo', 'pid=,ppid=,args='])
  return getProcessManifestFromSnapshot(stdout, userDataPath)
}

interface PerformanceScenarioTimingResult {
  readonly actionStartMs: number
  readonly domReadyMs: number
  readonly paintReadyMs: number
  readonly work?: {
    readonly allocations?: Readonly<Record<string, number>>
    readonly functions?: Readonly<Record<string, number>>
  }
}

interface PerformanceScenario {
  readonly action: (context: any, iteration: number) => Promise<void>
  readonly mode: 'cold' | 'warm'
  readonly prepare: (context: any, iteration: number) => Promise<void>
  readonly ready: (context: any, iteration: number) => Promise<void>
  readonly reset: (context: any, iteration: number) => Promise<void>
  readonly timing?: {
    readonly arm: (context: any, iteration: number) => Promise<void>
    readonly read: (context: any, iteration: number) => Promise<PerformanceScenarioTimingResult>
  }
  readonly validate: (context: any, iteration: number) => Promise<void>
}

const getPerformanceScenario = (module: any): PerformanceScenario | undefined => {
  const scenario = module.performanceScenario
  if (!scenario) {
    return undefined
  }
  if (scenario.mode !== 'cold' && scenario.mode !== 'warm') {
    throw new Error(`performanceScenario.mode must be "cold" or "warm"`)
  }
  for (const name of ['prepare', 'action', 'ready', 'validate', 'reset'] as const) {
    if (typeof scenario[name] !== 'function') {
      throw new Error(`performanceScenario.${name} must be a function`)
    }
  }
  if (scenario.timing && (typeof scenario.timing.arm !== 'function' || typeof scenario.timing.read !== 'function')) {
    throw new Error(`performanceScenario.timing must provide arm and read functions`)
  }
  return scenario
}

const assertTimingResult = (value: PerformanceScenarioTimingResult): void => {
  const values = [value?.actionStartMs, value?.domReadyMs, value?.paintReadyMs]
  if (values.some((item) => typeof item !== 'number' || !Number.isFinite(item))) {
    throw new Error(`performanceScenario.timing.read returned invalid timestamps`)
  }
  if (value.domReadyMs < value.actionStartMs || value.paintReadyMs < value.domReadyMs) {
    throw new Error(`performanceScenario.timing.read returned non-monotonic timestamps`)
  }
}

const getCodeMarks = async (context: any): Promise<readonly PerformanceMark[]> => {
  if (typeof context.Performance?.getCodeMarks !== 'function') {
    return []
  }
  return context.Performance.getCodeMarks()
}

const getNewMarks = (before: readonly PerformanceMark[], after: readonly PerformanceMark[]): readonly PerformanceMark[] => {
  return after.slice(before.length)
}

export const beforeSetup = async (module: any, context: any) => {
  if (module.beforeSetup) {
    await module.beforeSetup(context)
  }
}

export const setup = async (module: any, context: any) => {
  if (module.setup) {
    await module.setup(context)
  }
  const scenario = getPerformanceScenario(module)
  if (!scenario) {
    return
  }
  if (scenario.mode === 'warm') {
    await scenario.prepare(context, -1)
    await scenario.timing?.arm(context, -1)
    await scenario.action(context, -1)
    await scenario.ready(context, -1)
    if (scenario.timing) {
      const timing = await scenario.timing.read(context, -1)
      assertTimingResult(timing)
    }
    await scenario.validate(context, -1)
    await scenario.reset(context, -1)
  }
  await scenario.prepare(context, 0)
  await scenario.timing?.arm(context, 0)
  processManifests.set(module, await getPerformanceProcessManifest())
}

export const teardown = async (module: any, context: any) => {
  const scenario = getPerformanceScenario(module)
  if (scenario) {
    await scenario.validate(context, 0)
    await scenario.reset(context, 0)
  }
  if (module.teardown) {
    await module.teardown(context)
  }
}

export const run = async (module: any, context: any) => {
  const scenario = getPerformanceScenario(module)
  if (scenario) {
    const marksBefore = await getCodeMarks(context)
    const start = performance.now()
    await scenario.action(context, 0)
    await scenario.ready(context, 0)
    const timing = scenario.timing ? await scenario.timing.read(context, 0) : undefined
    const workerLatencyMs = performance.now() - start
    if (timing) {
      assertTimingResult(timing)
    }
    const domReadyLatencyMs = timing ? timing.domReadyMs - timing.actionStartMs : workerLatencyMs
    const paintedLatencyMs = timing ? timing.paintReadyMs - timing.actionStartMs : workerLatencyMs
    const marksAfter = await getCodeMarks(context)
    return {
      performanceScenario: {
        clock: timing ? 'renderer' : 'test-worker',
        codeMarks: getNewMarks(marksBefore, marksAfter),
        domReadyLatencyMs,
        latencyMs: domReadyLatencyMs,
        mode: scenario.mode,
        paintedLatencyMs,
        processManifest: processManifests.get(module) || [],
        workerLatencyMs,
        work: timing?.work || {
          allocations: {},
          functions: {},
        },
      },
    }
  }
  if (!module.run) {
    throw new Error(`test case is missing a run function`)
  }
  await module.run(context)
  return undefined
}
