import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { constants, createReadStream } from 'node:fs'
import { copyFile, cp, mkdir, readFile, readdir, rename, rm, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { diffProfileSummaries, summarizeProfiles } from './CpuProfile.ts'
import { getExperimentVerdict, getPhaseBreakdown, type WorkComparison, type WorkCounters } from './Experiment.ts'
import { hashPaths } from './Hash.ts'
import { parseScoreResult } from './ScoreResult.ts'
import { getMetricStatistics } from './Statistics.ts'
import { getSystemMetadata } from './SystemMetadata.ts'
import type { ExperimentArm, ExperimentTier, Goal, SamplePosition, ScoreSample } from './Types.ts'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const resultsRoot = join(repositoryRoot, '.vscode-memory-leak-finder-results')
const defaultArtifactsRoot = join(repositoryRoot, '.performance-lab')
const runtimeRoot = join(repositoryRoot, '.performance-lab-runtime')

export interface CommonRunOptions {
  readonly blocks: number
  readonly collectWork: boolean
  readonly cpuList?: string
  readonly display: string
  readonly orderSeed: number
  readonly outputPath?: string
  readonly replicaId: string
  readonly samples: number
  readonly scenario: string
  readonly tier: ExperimentTier
  readonly trackingIncludePatterns: readonly string[]
  readonly workSamples: number
}

export interface BuildOptions {
  readonly sourcePath?: string
  readonly vscodePath: string
}

const getScenarioName = (scenario: string): string => {
  return scenario.replace(/^\^/, '').replace(/\$$/, '').replace(/\.ts$/, '')
}

const getResultPath = (measure: string, scenario: string): string => {
  return join(resultsRoot, measure, `${getScenarioName(scenario).replaceAll('.', '-')}.json`)
}

const getDefaultOutputPath = (command: string): string => {
  const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
  return join(defaultArtifactsRoot, `${timestamp}-${command}`)
}

const getHarnessPaths = (): readonly string[] => {
  return [
    join(repositoryRoot, 'packages', 'e2e', 'src'),
    join(repositoryRoot, 'packages', 'memory-leak-finder', 'src'),
    join(repositoryRoot, 'packages', 'page-object', 'src'),
    join(repositoryRoot, 'packages', 'performance-lab', 'src'),
    join(repositoryRoot, 'packages', 'test-coordinator', 'src'),
    join(repositoryRoot, 'packages', 'test-worker', 'src'),
  ]
}

const runCommand = async (command: string, args: readonly string[], env: NodeJS.ProcessEnv, cpuList?: string): Promise<void> => {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const executable = cpuList && process.platform === 'linux' ? 'taskset' : command
    const executableArgs = cpuList && process.platform === 'linux' ? ['-c', cpuList, command, ...args] : args
    const child = spawn(executable, executableArgs, {
      cwd: repositoryRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      output += chunk
      process.stdout.write(chunk)
    })
    child.stderr.on('data', (chunk: string) => {
      output += chunk
      process.stderr.write(chunk)
    })
    child.once('error', rejectPromise)
    child.once('exit', (code) => {
      if (code === 0) {
        resolvePromise()
      } else {
        rejectPromise(new Error(`Performance scenario failed with exit code ${code}\n${output}`))
      }
    })
  })
}

const runMeasure = async ({
  artifactPath,
  cpuList,
  display,
  measure,
  scenario,
  sourcePath,
  trackingIncludePatterns = [],
  vscodePath,
}: {
  readonly artifactPath: string
  readonly cpuList?: string
  readonly display: string
  readonly measure: string
  readonly scenario: string
  readonly sourcePath?: string
  readonly trackingIncludePatterns?: readonly string[]
  readonly vscodePath: string
}): Promise<any> => {
  const resultPath = getResultPath(measure, scenario)
  const userDataPath = join(dirname(artifactPath), `.user-data-${process.pid}-${Date.now()}`)
  await mkdir(dirname(userDataPath), { recursive: true })
  await unlink(resultPath).catch((error) => {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  })
  const args = [
    'packages/cli/bin/test.js',
    '--run-skipped-tests-anyway',
    '--only',
    getScenarioName(scenario),
    '--runs',
    '1',
    '--measure',
    measure,
    '--vscode-path',
    vscodePath,
  ]
  try {
    await runCommand(
      process.execPath,
      args,
      {
        ...process.env,
        DISPLAY: display,
        VSCODE_PERFORMANCE_TRACK_INCLUDE: JSON.stringify(trackingIncludePatterns),
        VSCODE_PERFORMANCE_SOURCE_PATH: sourcePath || '',
        VSCODE_PERFORMANCE_USER_DATA_DIR: userDataPath,
      },
      cpuList,
    )
    await mkdir(dirname(artifactPath), { recursive: true })
    await copyFile(resultPath, artifactPath)
    return JSON.parse(await readFile(resultPath, 'utf8'))
  } finally {
    await rm(userDataPath, { force: true, recursive: true })
  }
}

const getWorkRows = (result: any, kind: 'allocations' | 'functions'): readonly any[] => {
  const rows = kind === 'allocations' ? result?.trackedAllocations : result?.trackedFunctions
  if (!Array.isArray(rows)) {
    throw new Error(`Tracked ${kind} result is missing source-mapped rows`)
  }
  return rows
}

export const parseWorkCounts = (result: any, kind: 'allocations' | 'functions'): Readonly<Record<string, number>> => {
  const counts: Record<string, number> = Object.create(null)
  for (const row of getWorkRows(result, kind)) {
    const count = kind === 'allocations' ? row?.createdCount : row?.delta
    if (typeof count !== 'number' || !Number.isFinite(count) || count <= 0) {
      continue
    }
    const key = row?.originalSource || row?.originalLocation || (kind === 'allocations' ? row?.location : row?.functionName)
    counts[String(key)] = (counts[String(key)] || 0) + count
  }
  return counts
}

const getScenarioHash = async (scenario: string): Promise<string> => {
  const scenarioName = getScenarioName(scenario)
  const paths = [
    join(repositoryRoot, 'packages', 'e2e', 'src', `${scenarioName}.ts`),
    join(repositoryRoot, 'packages', 'e2e', 'src', 'editor-open-text-file-performance-scenario.ts'),
  ]
  const hash = createHash('sha256')
  for (const path of paths) {
    try {
      hash.update(await readFile(path))
    } catch {
      // Not every scenario uses the editor-open helper.
    }
  }
  return hash.digest('hex')
}

const assertHarnessUnchanged = async (before: string): Promise<void> => {
  const after = await hashPaths(getHarnessPaths())
  if (after !== before) {
    throw new Error(`Performance harness changed while the experiment was running`)
  }
}

const writeExperiment = async (outputPath: string, value: unknown): Promise<string> => {
  const path = join(outputPath, 'experiment.json')
  await mkdir(outputPath, { recursive: true })
  await writeFile(path, JSON.stringify(value, null, 2) + '\n')
  return path
}

const getScoreStatistics = (samples: readonly ScoreSample[]) => {
  return {
    contextSwitches: getMetricStatistics(samples.map(({ contextSwitches }) => contextSwitches)),
    cycles: getMetricStatistics(samples.map(({ cycles }) => cycles)),
    instructions: getMetricStatistics(samples.map(({ instructions }) => instructions)),
    instructionsPerCycle: getMetricStatistics(samples.map(({ instructionsPerCycle }) => instructionsPerCycle)),
    latencyMs: getMetricStatistics(samples.map(({ latencyMs }) => latencyMs)),
    pageFaults: getMetricStatistics(samples.map(({ pageFaults }) => pageFaults)),
    paintedLatencyMs: getMetricStatistics(samples.map(({ paintedLatencyMs }) => paintedLatencyMs)),
    taskClockMs: getMetricStatistics(samples.map(({ taskClockMs }) => taskClockMs)),
    workerLatencyMs: getMetricStatistics(samples.map(({ workerLatencyMs }) => workerLatencyMs)),
  }
}

const getProcessBreakdown = (samples: readonly ScoreSample[]) => {
  return {
    renderer: {
      pids: samples.map(({ pid }) => pid),
      taskClockMs: getMetricStatistics(samples.map(({ taskClockMs }) => taskClockMs)),
    },
  }
}

const getRuntimePath = (): string => {
  return join(runtimeRoot, `${process.pid}-${Date.now()}`)
}

const stageBuild = async (build: BuildOptions, runtimePath: string, label: string): Promise<void> => {
  const stagedPath = join(runtimePath, label)
  await rm(stagedPath, { force: true, recursive: true })
  await mkdir(runtimePath, { recursive: true })
  await cp(dirname(build.vscodePath), stagedPath, {
    force: true,
    mode: constants.COPYFILE_FICLONE,
    preserveTimestamps: true,
    recursive: true,
  })
}

const removeRuntimePath = async (runtimePath: string): Promise<void> => {
  await rm(runtimePath, { force: true, recursive: true })
}

const warmFile = async (path: string): Promise<void> => {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const stream = createReadStream(path)
    stream.on('data', () => {})
    stream.once('end', resolvePromise)
    stream.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        resolvePromise()
      } else {
        rejectPromise(error)
      }
    })
  })
}

const warmActiveBuild = async (activePath: string, executableName: string): Promise<void> => {
  const rootEntries = await readdir(activePath, { withFileTypes: true })
  const rootFiles = rootEntries
    .filter((entry) => entry.isFile() && (entry.name.endsWith('.pak') || entry.name.endsWith('.so')))
    .map((entry) => join(activePath, entry.name))
  const paths = [
    join(activePath, executableName),
    join(activePath, 'icudtl.dat'),
    join(activePath, 'resources.pak'),
    join(activePath, 'snapshot_blob.bin'),
    join(activePath, 'v8_context_snapshot.bin'),
    join(activePath, 'resources', 'app', 'node_modules.asar'),
    join(activePath, 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js'),
    join(activePath, 'resources', 'app', 'package.json'),
    join(activePath, 'resources', 'app', 'product.json'),
    ...rootFiles,
  ]
  for (const path of new Set(paths)) {
    await warmFile(path)
  }
}

const withStagedBuild = async <T>(
  build: BuildOptions,
  runtimePath: string,
  label: string,
  fn: (vscodePath: string) => Promise<T>,
): Promise<T> => {
  const stagedPath = join(runtimePath, label)
  const activePath = join(runtimePath, 'vscode')
  await rename(stagedPath, activePath)
  try {
    await warmActiveBuild(activePath, basename(build.vscodePath))
    return await fn(join(activePath, basename(build.vscodePath)))
  } finally {
    await rename(activePath, stagedPath)
  }
}

const runScoreSample = async (
  build: BuildOptions,
  common: CommonRunOptions,
  outputPath: string,
  runtimePath: string,
  label: string,
  index: number,
  position?: SamplePosition,
): Promise<ScoreSample> => {
  const artifactPath = join(outputPath, 'raw', label, `sample-${String(index + 1).padStart(2, '0')}.json`)
  const rawResult = await withStagedBuild(build, runtimePath, label, (vscodePath) =>
    runMeasure({
      artifactPath,
      ...(common.cpuList ? { cpuList: common.cpuList } : {}),
      display: common.display,
      measure: 'cpu-performance-counters',
      scenario: common.scenario,
      vscodePath,
    }),
  )
  return parseScoreResult(rawResult, position)
}

const runWorkSample = async (
  build: BuildOptions,
  common: CommonRunOptions,
  outputPath: string,
  runtimePath: string,
  label: string,
  index: number,
): Promise<WorkCounters> => {
  const run = async (kind: 'allocations' | 'functions') => {
    const measure = kind === 'allocations' ? 'tracked-allocations' : 'tracked-functions'
    const artifactPath = join(outputPath, 'diagnostics', 'work', label, `${kind}-${String(index + 1).padStart(2, '0')}.json`)
    return withStagedBuild(build, runtimePath, label, (vscodePath) =>
      runMeasure({
        artifactPath,
        ...(common.cpuList ? { cpuList: common.cpuList } : {}),
        display: common.display,
        measure,
        scenario: common.scenario,
        ...(build.sourcePath ? { sourcePath: build.sourcePath } : {}),
        trackingIncludePatterns: common.trackingIncludePatterns,
        vscodePath,
      }),
    )
  }
  const functionResult = await run('functions')
  const allocationResult = await run('allocations')
  return {
    allocations: parseWorkCounts(allocationResult, 'allocations'),
    functions: parseWorkCounts(functionResult, 'functions'),
  }
}

const runWorkComparison = async (
  baselineBuild: BuildOptions,
  candidateBuild: BuildOptions,
  common: CommonRunOptions,
  outputPath: string,
  runtimePath: string,
): Promise<WorkComparison> => {
  const result: {
    baseline: WorkCounters[]
    candidate: WorkCounters[]
  } = {
    baseline: [],
    candidate: [],
  }
  const blocks = Math.ceil(common.workSamples / 2)
  for (const { label } of getInterleavedOrder(blocks, common.orderSeed ^ 0x7a11c)) {
    if (result[label].length >= common.workSamples) {
      continue
    }
    const build = label === 'baseline' ? baselineBuild : candidateBuild
    result[label].push(await runWorkSample(build, common, outputPath, runtimePath, label, result[label].length))
  }
  return result
}

export const runBaseline = async (build: BuildOptions, common: CommonRunOptions): Promise<string> => {
  const outputPath = common.outputPath || getDefaultOutputPath('baseline')
  const runtimePath = getRuntimePath()
  const harnessHash = await hashPaths(getHarnessPaths())
  const samples: ScoreSample[] = []
  try {
    await stageBuild(build, runtimePath, 'baseline')
    for (let index = 0; index < common.samples; index++) {
      samples.push(await runScoreSample(build, common, outputPath, runtimePath, 'baseline', index))
    }
  } finally {
    await removeRuntimePath(runtimePath)
  }
  await assertHarnessUnchanged(harnessHash)
  return writeExperiment(outputPath, {
    baseline: {
      phaseBreakdown: getPhaseBreakdown(samples),
      processBreakdown: getProcessBreakdown(samples),
      samples,
      statistics: getScoreStatistics(samples),
    },
    command: 'baseline',
    createdAt: new Date().toISOString(),
    harnessHash,
    metadata: await getSystemMetadata(build.vscodePath, build.sourcePath),
    scenario: {
      hash: await getScenarioHash(common.scenario),
      name: getScenarioName(common.scenario),
    },
    schemaVersion: 2,
  })
}

interface OrderEntry extends SamplePosition {
  readonly label: ExperimentArm
}

const createRandom = (seed: number): (() => number) => {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

export const getInterleavedOrder = (blocks: number, seed: number): readonly OrderEntry[] => {
  const order: OrderEntry[] = []
  const random = createRandom(seed)
  for (let blockIndex = 0; blockIndex < blocks; blockIndex++) {
    const pattern = random() < 0.5 ? 'ABBA' : 'BAAB'
    const labels: readonly ExperimentArm[] =
      pattern === 'ABBA' ? ['baseline', 'candidate', 'candidate', 'baseline'] : ['candidate', 'baseline', 'baseline', 'candidate']
    for (let blockPosition = 0; blockPosition < labels.length; blockPosition++) {
      order.push({
        blockIndex,
        blockPosition,
        label: labels[blockPosition],
        orderIndex: order.length,
        pattern,
      })
    }
  }
  return order
}

export const runComparison = async (
  baselineBuild: BuildOptions,
  candidateBuild: BuildOptions,
  common: CommonRunOptions,
  goal: Goal,
): Promise<string> => {
  const outputPath = common.outputPath || getDefaultOutputPath('compare')
  const runtimePath = getRuntimePath()
  const harnessHash = await hashPaths(getHarnessPaths())
  const baseline: ScoreSample[] = []
  const candidate: ScoreSample[] = []
  let workComparison: WorkComparison | undefined
  try {
    await stageBuild(baselineBuild, runtimePath, 'baseline')
    await stageBuild(candidateBuild, runtimePath, 'candidate')
    for (const entry of getInterleavedOrder(common.blocks, common.orderSeed)) {
      const { label, ...position } = entry
      const target = label === 'baseline' ? baseline : candidate
      const build = label === 'baseline' ? baselineBuild : candidateBuild
      target.push(await runScoreSample(build, common, outputPath, runtimePath, label, target.length, position))
    }
    if (common.collectWork) {
      workComparison = await runWorkComparison(baselineBuild, candidateBuild, common, outputPath, runtimePath)
    }
  } finally {
    await removeRuntimePath(runtimePath)
  }
  await assertHarnessUnchanged(harnessHash)
  const result = getExperimentVerdict(baseline, candidate, goal, common.tier, workComparison)
  return writeExperiment(outputPath, {
    baseline: {
      metadata: await getSystemMetadata(baselineBuild.vscodePath, baselineBuild.sourcePath),
      phaseBreakdown: getPhaseBreakdown(baseline),
      processBreakdown: getProcessBreakdown(baseline),
      samples: baseline,
      statistics: getScoreStatistics(baseline),
    },
    candidate: {
      metadata: await getSystemMetadata(candidateBuild.vscodePath, candidateBuild.sourcePath),
      phaseBreakdown: getPhaseBreakdown(candidate),
      processBreakdown: getProcessBreakdown(candidate),
      samples: candidate,
      statistics: getScoreStatistics(candidate),
    },
    command: 'compare',
    comparisons: result.comparisons,
    createdAt: new Date().toISOString(),
    goal,
    harnessHash,
    order: getInterleavedOrder(common.blocks, common.orderSeed),
    replicaId: common.replicaId,
    scenario: {
      hash: await getScenarioHash(common.scenario),
      name: getScenarioName(common.scenario),
    },
    schemaVersion: 2,
    tier: common.tier,
    verdict: result.verdict,
    ...(workComparison ? { workComparison } : {}),
  })
}

const getRawProfile = (result: any): any => {
  const profile = result?.cpuProfile?.raw?.after
  if (!profile?.nodes || !profile?.samples) {
    throw new Error(`CPU profile result is missing raw profile data`)
  }
  return profile
}

const runDiagnosticBuild = async (
  build: BuildOptions,
  common: CommonRunOptions,
  outputPath: string,
  runtimePath: string,
  label: string,
): Promise<{ readonly profiles: readonly any[]; readonly summary: Awaited<ReturnType<typeof summarizeProfiles>> }> => {
  const profiles: any[] = []
  for (let index = 0; index < common.samples; index++) {
    const artifactPath = join(outputPath, 'raw', label, `sample-${String(index + 1).padStart(2, '0')}.json`)
    const result = await withStagedBuild(build, runtimePath, label, (vscodePath) =>
      runMeasure({
        artifactPath,
        ...(common.cpuList ? { cpuList: common.cpuList } : {}),
        display: common.display,
        measure: 'cpu-profile',
        scenario: common.scenario,
        vscodePath,
      }),
    )
    const profile = getRawProfile(result)
    profiles.push(profile)
    await writeFile(artifactPath.replace(/\.json$/, '.cpuprofile'), JSON.stringify(profile))
  }
  return {
    profiles,
    summary: await summarizeProfiles(profiles, build.sourcePath),
  }
}

export const runDiagnosis = async (
  baselineBuild: BuildOptions,
  candidateBuild: BuildOptions | undefined,
  common: CommonRunOptions,
): Promise<string> => {
  const outputPath = common.outputPath || getDefaultOutputPath('diagnose')
  const runtimePath = getRuntimePath()
  const harnessHash = await hashPaths(getHarnessPaths())
  let baseline: Awaited<ReturnType<typeof runDiagnosticBuild>>
  let candidate: Awaited<ReturnType<typeof runDiagnosticBuild>> | undefined
  try {
    await stageBuild(baselineBuild, runtimePath, 'baseline')
    if (candidateBuild) {
      await stageBuild(candidateBuild, runtimePath, 'candidate')
    }
    baseline = await runDiagnosticBuild(baselineBuild, common, outputPath, runtimePath, 'baseline')
    candidate = candidateBuild ? await runDiagnosticBuild(candidateBuild, common, outputPath, runtimePath, 'candidate') : undefined
  } finally {
    await removeRuntimePath(runtimePath)
  }
  await assertHarnessUnchanged(harnessHash)
  return writeExperiment(outputPath, {
    baseline: {
      metadata: await getSystemMetadata(baselineBuild.vscodePath, baselineBuild.sourcePath),
      summary: baseline.summary,
    },
    ...(candidate && candidateBuild
      ? {
          candidate: {
            metadata: await getSystemMetadata(candidateBuild.vscodePath, candidateBuild.sourcePath),
            summary: candidate.summary,
          },
          hotspotDiff: diffProfileSummaries(baseline.summary, candidate.summary),
        }
      : {}),
    command: 'diagnose',
    createdAt: new Date().toISOString(),
    harnessHash,
    scenario: {
      hash: await getScenarioHash(common.scenario),
      name: getScenarioName(common.scenario),
    },
    schemaVersion: 2,
  })
}
