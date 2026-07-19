import { resolve } from 'node:path'
import { aggregateExperimentDirectory } from './Aggregate.ts'
import { parseGoal } from './Goal.ts'
import { runBaseline, runComparison, runDiagnosis, type BuildOptions, type CommonRunOptions } from './Runner.ts'

const getString = (argv: readonly string[], name: string, fallback = ''): string => {
  const index = argv.lastIndexOf(name)
  const value = argv[index + 1]
  return index === -1 || typeof value !== 'string' ? fallback : value
}

const getNumber = (argv: readonly string[], name: string, fallback: number): number => {
  const value = Number.parseInt(getString(argv, name, String(fallback)), 10)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

const getInteger = (argv: readonly string[], name: string, fallback: number): number => {
  const value = Number.parseInt(getString(argv, name, String(fallback)), 10)
  return Number.isFinite(value) ? value : fallback
}

const getStrings = (argv: readonly string[], name: string): readonly string[] => {
  const values: string[] = []
  for (let index = 0; index < argv.length - 1; index++) {
    if (argv[index] === name) {
      values.push(argv[index + 1])
    }
  }
  return values
}

const requireString = (argv: readonly string[], name: string): string => {
  const value = getString(argv, name)
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return resolve(value)
}

const getCommonOptions = (argv: readonly string[], defaultSamples: number): CommonRunOptions => {
  const output = getString(argv, '--output')
  const tier = getString(argv, '--tier', argv.includes('--confirm') ? 'confirmation' : 'quick')
  if (tier !== 'quick' && tier !== 'confirmation') {
    throw new Error(`--tier must be "quick" or "confirmation"`)
  }
  const cpuList = getString(argv, '--cpu-list')
  return {
    blocks: getNumber(argv, '--blocks', tier === 'confirmation' ? 50 : 12),
    collectWork: argv.includes('--collect-work'),
    ...(cpuList ? { cpuList } : {}),
    deferCalibrationVerdict: argv.includes('--defer-calibration-verdict'),
    display: getString(argv, '--display', process.env.DISPLAY || ':1'),
    orderSeed: getInteger(argv, '--order-seed', 0x51f15e),
    ...(output ? { outputPath: resolve(output) } : {}),
    replicaId: getString(argv, '--replica-id', 'local'),
    samples: getNumber(argv, '--samples', defaultSamples),
    scenario: getString(argv, '--scenario', 'editor-open-text-file-warm-performance'),
    tier,
    trackingIncludePatterns: getStrings(argv, '--track-include'),
    workSamples: getNumber(argv, '--work-samples', 3),
  }
}

const getBuildOptions = (argv: readonly string[], prefix = ''): BuildOptions => {
  const source = getString(argv, `--${prefix}vscode-source-path`)
  return {
    ...(source ? { sourcePath: resolve(source) } : {}),
    vscodePath: requireString(argv, `--${prefix}vscode-path`),
  }
}

const printUsage = (): void => {
  console.log(`Usage:
  performance-lab baseline --vscode-path PATH [--vscode-source-path PATH] [--samples 20]
  performance-lab diagnose --baseline-vscode-path PATH [--candidate-vscode-path PATH] [--samples 5]
  performance-lab compare --baseline-vscode-path PATH --candidate-vscode-path PATH [--goal latency:-50%] [--blocks 12]
  performance-lab aggregate --input PATH --output PATH --expected-replicas 3

Common options: --scenario NAME --display DISPLAY --output PATH --tier quick|confirmation
                --cpu-list LIST --order-seed NUMBER --replica-id ID
                --defer-calibration-verdict
                --collect-work --work-samples NUMBER --track-include SOURCE_PATTERN`)
}

export const runCli = async (argv: readonly string[]): Promise<string | undefined> => {
  const command = argv[0]
  if (!command || command === '--help' || command === '-h') {
    printUsage()
    return undefined
  }
  switch (command) {
    case 'aggregate':
      return aggregateExperimentDirectory(
        requireString(argv, '--input'),
        requireString(argv, '--output'),
        getNumber(argv, '--expected-replicas', 3),
        getString(argv, '--calibration-history') ? resolve(getString(argv, '--calibration-history')) : undefined,
      )
    case 'baseline':
      return runBaseline(getBuildOptions(argv), getCommonOptions(argv, 20))
    case 'compare':
      return runComparison(
        getBuildOptions(argv, 'baseline-'),
        getBuildOptions(argv, 'candidate-'),
        getCommonOptions(argv, argv.includes('--confirm') ? 20 : 5),
        parseGoal(getString(argv, '--goal', 'latency:-5%')),
      )
    case 'diagnose': {
      const candidatePath = getString(argv, '--candidate-vscode-path')
      return runDiagnosis(
        getBuildOptions(argv, 'baseline-'),
        candidatePath ? getBuildOptions(argv, 'candidate-') : undefined,
        getCommonOptions(argv, 5),
      )
    }
    default:
      throw new Error(`Unknown performance-lab command "${command}"`)
  }
}
