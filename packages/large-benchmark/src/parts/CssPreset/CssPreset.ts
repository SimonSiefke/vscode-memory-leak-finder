import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { benchmarks } from '../Manifest/Manifest.ts'
import { command } from '../Io/Io.ts'
import { repositoryRoot } from '../Prepare/Prepare.ts'
import type { Benchmark, Collector } from '../Types/Types.ts'

const eligibilityUrl = new URL('../../../../test-worker/src/parts/TestEligibility/TestEligibility.ts', import.meta.url).href
const { testExclusionReason } = await import(eligibilityUrl)
export const focusedFiles = ['quick-pick-toggle.ts', 'suggest-widget-lifecycle-churn.ts', 'search-open.ts', 'settings-modern-ui-toggle.ts']
const focusedCollectors: Collector[] = ['timing', 'instructions', 'resources', 'renderer', 'timeline', 'css-selectors']
const e2eCollectors: Collector[] = ['timing', 'instructions', 'resources', 'renderer']

export interface SamplingPolicy {
  samples: number
  startupSamples: number
  cssSelectorSamples: number
}

export interface InventoryEntry {
  file: string
  sha256: string
  exclusion: string | null
  focused: boolean
  selected: boolean
  explicitOptIn: boolean
}

export interface CssPresetMetadata {
  name: 'css-specific'
  harnessCommit: string
  harnessSourceSha256: string
  inventorySha256: string
  inventory: InventoryEntry[]
  sampling: SamplingPolicy
  boundary: string
}

export const sourceHash = (source: string): string => createHash('sha256').update(source).digest('hex')

export const harnessSourceHash = async (root = repositoryRoot): Promise<string> => {
  const files = (
    await command(
      'git',
      [
        'ls-files',
        '--cached',
        '--others',
        '--exclude-standard',
        '--',
        'packages/large-benchmark',
        'packages/test-worker',
        'packages/page-object',
        'packages/injected-code',
        'packages/memory-leak-finder',
        'packages/e2e',
        'packages/test-coordinator/src/parts/DefaultVsCodeSettings/DefaultVsCodeSettings.json',
        '.github/workflows/large-performance.yml',
        '.nvmrc',
        'package.json',
        'package-lock.json',
      ],
      { cwd: root },
    )
  )
    .split('\n')
    .filter(Boolean)
    .sort()
  const hash = createHash('sha256')
  for (const file of files)
    hash
      .update(file + '\0')
      .update(await readFile(join(root, file)))
      .update('\0')
  return hash.digest('hex')
}

export const samplingPolicy = (get: (name: string, fallback?: string) => string, samples: number): SamplingPolicy => {
  const preset = get('--preset')
  if (preset && preset !== 'css-specific' && preset !== 'custom') throw new Error(`Unknown preset: ${preset}`)
  const css = preset === 'css-specific'
  const count = (name: string, fallback: number): number => {
    const value = Number(get(name, String(fallback)))
    if (!Number.isSafeInteger(value) || value < 1 || value > 1000) throw new Error(`${name} must be an integer between 1 and 1000`)
    return value
  }
  return {
    samples,
    startupSamples: count('--startup-samples', css ? 200 : samples),
    cssSelectorSamples: count('--css-selector-samples', css ? 37 : 5),
  }
}

export const freezeSamples = (benchmark: Benchmark, policy: SamplingPolicy): Benchmark => ({
  ...benchmark,
  samples:
    benchmark.collector === 'css-selectors'
      ? policy.cssSelectorSamples
      : benchmark.startup && ['timing', 'instructions'].includes(benchmark.collector)
        ? policy.startupSamples
        : policy.samples,
})

export const createCssPreset = async (
  policy: SamplingPolicy,
  root = repositoryRoot,
  load: (file: string) => Promise<any> = (file) => import(pathToFileURL(file).href),
): Promise<{ benchmarks: Benchmark[]; preset: CssPresetMetadata }> => {
  const inventory: InventoryEntry[] = []
  const registry = benchmarks.filter((benchmark) => focusedCollectors.includes(benchmark.collector)).map((benchmark) => ({ ...benchmark }))
  for (const benchmark of registry) {
    if (benchmark.startup) continue
    benchmark.sourceFile = `packages/e2e/src/performance-${benchmark.scenario}.ts`
    benchmark.explicitOptIn = true
  }
  registry.push(
    ...registry
      .filter((benchmark) => !benchmark.startup && benchmark.collector === 'timing')
      .map((benchmark) => ({
        ...benchmark,
        id: `${benchmark.scenario}-css-selectors`,
        collector: 'css-selectors' as const,
        diagnostic: true,
      })),
  )
  for (const name of (await readdir(join(root, 'packages/e2e/src')))
    .filter((name) => /\.(?:ts|js)$/.test(name) && !name.endsWith('.d.ts'))
    .sort()) {
    const file = `packages/e2e/src/${name}`
    const absolute = join(root, file)
    const source = await readFile(absolute, 'utf8')
    const module = await load(absolute)
    const exclusion: string | null = testExclusionReason(module, file, { isGithubActions: true })
    const dedicated = registry.some((benchmark) => benchmark.sourceFile === file)
    const focused = dedicated || focusedFiles.includes(name)
    const allowed = !testExclusionReason(module, file, { isGithubActions: true, forceRun: focused })
    const explicitOptIn = allowed && exclusion === 'skip'
    inventory.push({ file, sha256: sourceHash(source), exclusion, focused, selected: allowed, explicitOptIn })
    if (dedicated) {
      if (!allowed) throw new Error(`Focused workload is unavailable: ${name}`)
      continue
    }
    if (!allowed) continue
    if (typeof module.run !== 'function') throw new Error(`Selected E2E has no run function: ${file}`)
    for (const collector of focused ? focusedCollectors : e2eCollectors) {
      registry.push({
        id: `e2e-${name.replace(/\.(ts|js)$/, '')}-${collector}`,
        scenario: name.replace(/\.(ts|js)$/, ''),
        collector,
        startup: false,
        cache: 'action',
        diagnostic: collector === 'css-selectors',
        sourceFile: file,
        sourceSha256: sourceHash(source),
        explicitOptIn,
      })
    }
  }
  for (const file of focusedFiles) {
    if (!inventory.some((entry) => entry.file.endsWith('/' + file))) throw new Error(`Focused workload is unavailable: ${file}`)
  }
  for (const benchmark of registry) {
    if (benchmark.sourceFile) benchmark.sourceSha256 = sourceHash(await readFile(join(root, benchmark.sourceFile), 'utf8'))
  }
  return {
    benchmarks: registry.map((benchmark) => freezeSamples(benchmark, policy)),
    preset: {
      name: 'css-specific',
      harnessCommit: await command('git', ['rev-parse', 'HEAD'], { cwd: root }),
      harnessSourceSha256: await harnessSourceHash(root),
      inventorySha256: sourceHash(JSON.stringify(inventory)),
      inventory,
      sampling: policy,
      boundary:
        'Interactions: scenario.run(), excluding launch/setup/teardown; startup: spawn to visible readiness; collectors run separately.',
    },
  }
}
