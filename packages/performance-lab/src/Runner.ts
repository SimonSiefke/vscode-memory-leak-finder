import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { diffProfileSummaries, summarizeProfiles } from './CpuProfile.ts'
import { getExperimentVerdict, getPhaseBreakdown } from './Experiment.ts'
import { hashPaths } from './Hash.ts'
import { parseScoreResult } from './ScoreResult.ts'
import { getMetricStatistics } from './Statistics.ts'
import { getSystemMetadata } from './SystemMetadata.ts'
import type { Goal, ScoreSample } from './Types.ts'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const resultsRoot = join(repositoryRoot, '.vscode-memory-leak-finder-results')
const defaultArtifactsRoot = join(repositoryRoot, '.performance-lab')

export interface CommonRunOptions {
  readonly display: string
  readonly outputPath?: string
  readonly samples: number
  readonly scenario: string
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

const runCommand = async (command: string, args: readonly string[], env: NodeJS.ProcessEnv): Promise<void> => {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
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
  display,
  measure,
  scenario,
  vscodePath,
}: {
  readonly artifactPath: string
  readonly display: string
  readonly measure: string
  readonly scenario: string
  readonly vscodePath: string
}): Promise<any> => {
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
  await runCommand(process.execPath, args, {
    ...process.env,
    DISPLAY: display,
  })
  const resultPath = getResultPath(measure, scenario)
  await mkdir(dirname(artifactPath), { recursive: true })
  await copyFile(resultPath, artifactPath)
  return JSON.parse(await readFile(resultPath, 'utf8'))
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
    taskClockMs: getMetricStatistics(samples.map(({ taskClockMs }) => taskClockMs)),
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

const runScoreSample = async (
  build: BuildOptions,
  common: CommonRunOptions,
  outputPath: string,
  label: string,
  index: number,
): Promise<ScoreSample> => {
  const artifactPath = join(outputPath, 'raw', label, `sample-${String(index + 1).padStart(2, '0')}.json`)
  const rawResult = await runMeasure({
    artifactPath,
    display: common.display,
    measure: 'cpu-performance-counters',
    scenario: common.scenario,
    vscodePath: build.vscodePath,
  })
  return parseScoreResult(rawResult)
}

export const runBaseline = async (build: BuildOptions, common: CommonRunOptions): Promise<string> => {
  const outputPath = common.outputPath || getDefaultOutputPath('baseline')
  const harnessHash = await hashPaths(getHarnessPaths())
  const samples: ScoreSample[] = []
  for (let index = 0; index < common.samples; index++) {
    samples.push(await runScoreSample(build, common, outputPath, 'baseline', index))
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
    schemaVersion: 1,
  })
}

const getInterleavedOrder = (samples: number): readonly ('baseline' | 'candidate')[] => {
  const order: ('baseline' | 'candidate')[] = []
  const counts = {
    baseline: 0,
    candidate: 0,
  }
  const pattern = ['baseline', 'candidate', 'candidate', 'baseline'] as const
  while (counts.baseline < samples || counts.candidate < samples) {
    for (const label of pattern) {
      if (counts[label] < samples) {
        order.push(label)
        counts[label]++
      }
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
  const harnessHash = await hashPaths(getHarnessPaths())
  const baseline: ScoreSample[] = []
  const candidate: ScoreSample[] = []
  for (const label of getInterleavedOrder(common.samples)) {
    const target = label === 'baseline' ? baseline : candidate
    const build = label === 'baseline' ? baselineBuild : candidateBuild
    target.push(await runScoreSample(build, common, outputPath, label, target.length))
  }
  await assertHarnessUnchanged(harnessHash)
  const result = getExperimentVerdict(baseline, candidate, goal)
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
    order: getInterleavedOrder(common.samples),
    scenario: {
      hash: await getScenarioHash(common.scenario),
      name: getScenarioName(common.scenario),
    },
    schemaVersion: 1,
    verdict: result.verdict,
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
  label: string,
): Promise<{ readonly profiles: readonly any[]; readonly summary: Awaited<ReturnType<typeof summarizeProfiles>> }> => {
  const profiles: any[] = []
  for (let index = 0; index < common.samples; index++) {
    const artifactPath = join(outputPath, 'raw', label, `sample-${String(index + 1).padStart(2, '0')}.json`)
    const result = await runMeasure({
      artifactPath,
      display: common.display,
      measure: 'cpu-profile',
      scenario: common.scenario,
      vscodePath: build.vscodePath,
    })
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
  const harnessHash = await hashPaths(getHarnessPaths())
  const baseline = await runDiagnosticBuild(baselineBuild, common, outputPath, 'baseline')
  const candidate = candidateBuild ? await runDiagnosticBuild(candidateBuild, common, outputPath, 'candidate') : undefined
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
    schemaVersion: 1,
  })
}
