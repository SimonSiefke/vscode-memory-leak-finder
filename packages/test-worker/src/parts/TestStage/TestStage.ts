interface PerformanceMark {
  readonly name: string
  readonly startTime: number
}

interface PerformanceScenario {
  readonly action: (context: any, iteration: number) => Promise<void>
  readonly mode: 'cold' | 'warm'
  readonly prepare: (context: any, iteration: number) => Promise<void>
  readonly ready: (context: any, iteration: number) => Promise<void>
  readonly reset: (context: any, iteration: number) => Promise<void>
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
  return scenario
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
    await scenario.action(context, -1)
    await scenario.ready(context, -1)
    await scenario.validate(context, -1)
    await scenario.reset(context, -1)
  }
  await scenario.prepare(context, 0)
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
    const latencyMs = performance.now() - start
    const marksAfter = await getCodeMarks(context)
    return {
      performanceScenario: {
        codeMarks: getNewMarks(marksBefore, marksAfter),
        latencyMs,
        mode: scenario.mode,
      },
    }
  }
  if (!module.run) {
    throw new Error(`test case is missing a run function`)
  }
  await module.run(context)
  return undefined
}
