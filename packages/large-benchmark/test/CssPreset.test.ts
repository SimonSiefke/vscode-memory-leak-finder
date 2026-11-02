import { afterEach, expect, test } from '@jest/globals'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { createCssPreset, focusedFiles, freezeSamples, harnessSourceHash, samplingPolicy } from '../src/parts/CssPreset/CssPreset.ts'
import { benchmarks, sampleCount, selectBenchmarks, validateRegistry } from '../src/parts/Manifest/Manifest.ts'
import { parseOptions } from '../src/parts/ParseOptions/ParseOptions.ts'
import { command } from '../src/parts/Io/Io.ts'
import { seriesMatrix } from '../src/parts/Series/Series.ts'

const directories: string[] = []
afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

const fixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'css-preset-'))
  directories.push(root)
  const folder = join(root, 'packages/e2e/src')
  await mkdir(folder, { recursive: true })
  const modules: Record<string, any> = {
    'ordinary.ts': { run() {} },
    'network.ts': { requiresNetwork: true, run() {} },
    'chat-offline.ts': { run() {} },
    'ci-only-skip.ts': { skipInCi: true, run() {} },
    'skipped.ts': { skip: 1, run() {} },
  }
  for (const file of focusedFiles) modules[file] = { skip: file === 'settings-modern-ui-toggle.ts' ? false : 1, run() {} }
  for (const benchmark of benchmarks.filter((b) => !b.startup && b.collector === 'timing'))
    modules[`performance-${benchmark.scenario}.ts`] = { skip: true, run() {} }
  for (const name of Object.keys(modules)) await writeFile(join(folder, name), `// ${name}\nexport const run = () => {}\n`)
  await command('git', ['init', '-q'], { cwd: root })
  await command('git', ['add', '.'], { cwd: root })
  await command('git', ['-c', 'user.name=Benchmark Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'fixture'], { cwd: root })
  return { root, modules, load: async (file: string) => modules[basename(file)] }
}

test('the preset freezes normal CI eligibility, focused opt-ins and source provenance without changing the legacy registry', async () => {
  const { root, load } = await fixture()
  const before = JSON.stringify(benchmarks)
  const policy = { samples: 37, startupSamples: 200, cssSelectorSamples: 19 }
  const result = await createCssPreset(policy, root, load)
  expect(JSON.stringify(benchmarks)).toBe(before)
  expect(result.preset.inventory.filter((e) => e.selected && !e.explicitOptIn).map((e) => e.file)).toEqual([
    'packages/e2e/src/ordinary.ts',
    'packages/e2e/src/settings-modern-ui-toggle.ts',
  ])
  expect(
    result.preset.inventory
      .filter((e) => e.explicitOptIn)
      .map((e) => basename(e.file))
      .sort(),
  ).toEqual(
    [
      ...benchmarks.filter((b) => !b.startup && b.collector === 'timing').map((b) => `performance-${b.scenario}.ts`),
      'quick-pick-toggle.ts',
      'search-open.ts',
      'suggest-widget-lifecycle-churn.ts',
    ].sort(),
  )
  expect(result.benchmarks.filter((b) => b.sourceFile?.includes('/performance-')).every((b) => b.explicitOptIn)).toBe(true)
  expect(result.preset.inventory.find((e) => e.file.endsWith('/chat-offline.ts'))!.exclusion).toBe('requiresCopilotAuth')
  expect(result.preset.inventory.find((e) => e.file.endsWith('/network.ts'))!.exclusion).toBe('requiresNetwork')
  expect(result.benchmarks.filter((b) => b.id.startsWith('e2e-ordinary-')).map((b) => b.collector)).toEqual([
    'timing',
    'instructions',
    'resources',
    'renderer',
  ])
  expect(result.benchmarks.find((b) => b.id === 'quick-open-css-selectors')!.samples).toBe(19)
  expect(result.benchmarks.find((b) => b.id === 'startup-empty-cold-timing')!.samples).toBe(200)
  expect(result.benchmarks.every((b) => !['smoke', 'memory', 'profile', 'bundles'].includes(b.collector))).toBe(true)
  expect(result.preset.harnessSourceSha256).toBe(await harnessSourceHash(root))
  validateRegistry(result.benchmarks)
  const original = result.preset.harnessSourceSha256
  await writeFile(join(root, 'packages/e2e/src/ordinary.ts'), 'changed')
  expect(await harnessSourceHash(root)).not.toBe(original)
  expect(result.benchmarks.find((b) => b.id === 'e2e-ordinary-timing')!.sourceSha256).toMatch(/^[a-f0-9]{64}$/)
})

test('focused workloads cannot override network/authentication/CI restrictions', async () => {
  const { root, modules, load } = await fixture()
  modules['quick-pick-toggle.ts'].requiresNetwork = true
  await expect(createCssPreset({ samples: 2, startupSamples: 2, cssSelectorSamples: 2 }, root, load)).rejects.toThrow(
    'Focused workload is unavailable',
  )
})

test('sample defaults and explicit overrides are independent and legacy limits remain intact', () => {
  const legacy = parseOptions([])
  expect(samplingPolicy(legacy.get, legacy.samples)).toEqual({ samples: 37, startupSamples: 37, cssSelectorSamples: 5 })
  const css = parseOptions(['--preset', 'css-specific', '--samples', '9', '--startup-samples', '25', '--css-selector-samples', '7'])
  const policy = samplingPolicy(css.get, css.samples)
  expect(policy).toEqual({ samples: 9, startupSamples: 25, cssSelectorSamples: 7 })
  const selector = selectBenchmarks('', 'css-selectors')[0]!
  expect(sampleCount(selector, 37)).toBe(5)
  expect(sampleCount(freezeSamples(selector, policy), 999)).toBe(7)
  expect(sampleCount(freezeSamples(selectBenchmarks('startup-empty-warm-instructions')[0]!, policy), 999)).toBe(25)
  expect(sampleCount(freezeSamples(selectBenchmarks('open-small-timing')[0]!, policy), 999)).toBe(9)
  for (const args of [
    ['--startup-samples', '0'],
    ['--css-selector-samples', '1001'],
    ['--preset', 'unknown'],
  ]) {
    const parsed = parseOptions(args)
    expect(() => samplingPolicy(parsed.get, parsed.samples)).toThrow()
  }
})

test('expanded inventories stay inside the matrix limit and every benchmark occurs exactly once per pair', () => {
  const many = Array.from({ length: 900 }, (_, i) => ({ ...benchmarks[0]!, id: `case-${i}` }))
  const matrix = seriesMatrix(['a'.repeat(40), 'b'.repeat(40)], many)
  expect(matrix.include.length).toBeLessThanOrEqual(256)
  const ids = matrix.include.flatMap((group) => group.benchmarks.split(','))
  expect(ids.sort()).toEqual(many.map((b) => b.id).sort())
})

test('a frozen source path, duplicate identity or invalid sample count is rejected', async () => {
  expect(() => validateRegistry([{ ...benchmarks[0]!, id: '../escape' }])).toThrow('identity')
  expect(() => validateRegistry([benchmarks[0]!, benchmarks[0]!])).toThrow('unique')
  expect(() => validateRegistry([{ ...benchmarks[0]!, samples: 0 }])).toThrow('sample count')
  expect(() => validateRegistry([{ ...benchmarks[0]!, sourceFile: 'outside.ts', sourceSha256: 'a'.repeat(64) }])).toThrow('source')
  const { createScenario } = await import('../src/parts/Shared/Shared.ts')
  const benchmark = {
    ...selectBenchmarks('open-small-timing')[0]!,
    sourceFile: 'packages/e2e/src/editor-open.ts',
    sourceSha256: '0'.repeat(64),
  }
  await expect(createScenario({} as any, {} as any, '/unused', 'editor-open', {}, benchmark)).rejects.toThrow(
    'Frozen scenario source changed',
  )
})
