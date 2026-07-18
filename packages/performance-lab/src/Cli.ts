import { resolve } from 'node:path'
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

const requireString = (argv: readonly string[], name: string): string => {
  const value = getString(argv, name)
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return resolve(value)
}

const getCommonOptions = (argv: readonly string[], defaultSamples: number): CommonRunOptions => {
  const output = getString(argv, '--output')
  return {
    display: getString(argv, '--display', process.env.DISPLAY || ':1'),
    ...(output ? { outputPath: resolve(output) } : {}),
    samples: getNumber(argv, '--samples', defaultSamples),
    scenario: getString(argv, '--scenario', 'editor-open-text-file-warm-performance'),
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
  performance-lab compare --baseline-vscode-path PATH --candidate-vscode-path PATH [--goal latency:-50%] [--samples 5]

Common options: --scenario NAME --display DISPLAY --output PATH`)
}

export const runCli = async (argv: readonly string[]): Promise<string | undefined> => {
  const command = argv[0]
  if (!command || command === '--help' || command === '-h') {
    printUsage()
    return undefined
  }
  switch (command) {
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
