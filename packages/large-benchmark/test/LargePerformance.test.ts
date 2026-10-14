import { afterEach, expect, jest, test } from '@jest/globals'
import { chmod, mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { benchmarks, sampleCount, sampleOrder, selectBenchmarks } from '../src/largePerformance/manifest.ts'
import { comparePairs, summarize } from '../src/largePerformance/statistics.ts'
import { prepareProfile, runBenchmark, type RunOptions } from '../src/largePerformance/runner.ts'
import { collectBundles, bundleChanges } from '../src/largePerformance/bundles.ts'
import { comparisonsFor, generateReport, validateResult } from '../src/largePerformance/report.ts'
import { command, writeJson } from '../src/largePerformance/io.ts'
import { extractBuild, sha256 } from '../src/largePerformance/prepare.ts'
import { parseOptions } from '../src/main.ts'
import type { Result, Sample } from '../src/largePerformance/types.ts'

const directories: string[] = []
const temporary = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'large-performance-test-'))
  directories.push(directory)
  return directory
}
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

const benchmark = selectBenchmarks('open-small-timing')[0]!
const commits = { before: 'a'.repeat(40), after: 'b'.repeat(40) }
const sample = (pair: number, revision: 'before' | 'after', value: number): Sample => ({
  pair,
  revision,
  order: sampleOrder(pair).indexOf(revision),
  status: 'success',
  metrics: [{ name: 'actionTime', unit: 'ms', value, coverage: 'renderer' }],
  diagnostics: [],
  raw: [],
  elapsedMs: 10,
})
const result = (): Result => ({
  schemaVersion: 1,
  benchmark,
  commits,
  requestedSamples: 5,
  status: 'success',
  runner: {},
  diagnostics: [],
  samples: Array.from({ length: 5 }, (_, pair) => [sample(pair, 'before', pair + 10), sample(pair, 'after', pair + 5)]).flat(),
})

test('manifest contains the full 104 runtime jobs and bundles with bounded diagnostic sample counts', () => {
  expect(benchmarks).toHaveLength(105)
  expect(new Set(benchmarks.map((entry) => entry.id)).size).toBe(105)
  expect(benchmarks.filter((entry) => entry.startup)).toHaveLength(20)
  expect(benchmarks.filter((entry) => entry.collector === 'profile')).toHaveLength(12)
  expect(sampleCount(selectBenchmarks('open-small-profile')[0]!, 37)).toBe(5)
  expect(sampleCount(benchmark, 37)).toBe(37)
  expect(sampleCount(selectBenchmarks('bundles')[0]!, 37)).toBe(1)
  expect(() => selectBenchmarks('nonexistent')).toThrow('Unknown benchmark IDs')
  expect(() => sampleCount(benchmark, 1.5)).toThrow()
})

test('sample order alternates and inputs reject malformed sample counts', () => {
  expect(sampleOrder(0)).toEqual(['before', 'after'])
  expect(sampleOrder(1)).toEqual(['after', 'before'])
  expect(parseOptions([]).samples).toBe(37)
  expect(parseOptions(['--benchmark-filter', '']).get('--benchmark-filter')).toBe('')
  for (const value of ['0', '-1', '1.5', '5oops', '1001']) expect(() => parseOptions(['--samples', value])).toThrow()
})

test('summaries preserve distributions and deterministic paired confidence intervals', () => {
  expect(summarize([1, 2, 3, 4, 100])).toMatchObject({ count: 5, mean: 22, median: 3, p95: 100, min: 1, max: 100 })
  const comparison = comparePairs([10, 11, 12, 13, 14], [5, 6, 7, 8, 9], 'mean')
  expect(comparison.interval[0]).toBeCloseTo(-5)
  expect(comparison.interval[1]).toBeCloseTo(-5)
  expect(comparison.inconclusive).toBe(false)
  expect(comparePairs([0, 0], [1, 1], 'median')).toMatchObject({ percentChange: null, inconclusive: true })
  expect(comparePairs([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], 'median').inconclusive).toBe(true)
  expect(comparePairs([10, 11, 12, 13, 14], [5, 6, 7, 8, 9], 'mean')).toEqual(comparison)
})

test('comparison excludes failed samples and incomplete pairs rather than mixing independent populations', () => {
  const data = result()
  data.samples[1]!.status = 'failed'
  data.samples = data.samples.filter((entry) => !(entry.pair === 3 && entry.revision === 'before'))
  const comparison = comparisonsFor(data)[0]!
  expect(comparison.statistics.beforeSamples).toEqual([11, 12, 14])
  expect(comparison.statistics.afterSamples).toEqual([6, 7, 9])
  expect(comparison.statistics.before.count).toBe(3)
})

test('result validation rejects nonfinite metrics, duplicate samples, wrong commits, and escaping raw paths', () => {
  const data = result()
  expect(validateResult(data, benchmark, commits).benchmark).toBe(benchmark)
  expect(() => validateResult({ ...data, commits: { ...commits, after: 'c'.repeat(40) } }, benchmark, commits)).toThrow()
  expect(() => validateResult({ ...data, samples: [...data.samples, data.samples[0]] }, benchmark, commits)).toThrow('duplicate')
  data.samples[0]!.metrics[0]!.value = Infinity
  expect(() => validateResult(data, benchmark, commits)).toThrow('metric')
  data.samples[0]!.metrics[0]!.value = 10
  data.samples[0]!.raw = ['../../escape']
  expect(() => validateResult(data, benchmark, commits)).toThrow('reference')
})

test('profile preparation resets only its owned directory and writes deterministic settings', async () => {
  const directory = await temporary()
  const profile = join(directory, 'profile')
  await mkdir(profile)
  await writeFile(join(profile, 'old-cache'), 'stale')
  await writeFile(join(directory, 'unrelated'), 'keep')
  await prepareProfile(profile)
  await expect(readFile(join(profile, 'old-cache'))).rejects.toThrow()
  expect(await readFile(join(directory, 'unrelated'), 'utf8')).toBe('keep')
  expect(JSON.parse(await readFile(join(profile, 'User', 'settings.json'), 'utf8'))).toMatchObject({
    'update.mode': 'none',
    'editor.smoothScrolling': false,
  })
})

test('runner persists each completed sample and continues after an injected collector exception', async () => {
  const output = await temporary()
  const options: RunOptions = { benchmark, commits, samples: 2, output, paths: { before: '/before/code', after: '/after/code' } }
  const order: string[] = []
  const measure = jest.fn(async (_options: RunOptions, pair: number, revision: 'before' | 'after', index: number): Promise<Sample> => {
    const persisted = JSON.parse(await readFile(join(output, 'result.json'), 'utf8')) as Result
    expect(persisted.samples).toHaveLength(order.length)
    order.push(`${pair}:${revision}`)
    if (pair === 0 && revision === 'before') throw new Error('injected failure')
    return { ...sample(pair, revision, 10), order: index }
  })
  const data = await runBenchmark(options, measure)
  expect(order).toEqual(['0:before', '0:after', '1:after', '1:before'])
  expect(data.status).toBe('partial')
  expect(data.samples).toHaveLength(4)
  expect(data.samples[0]!.diagnostics).toEqual(['injected failure'])
  expect(comparisonsFor(data)[0]!.statistics.before.count).toBe(1)
})

test('bundles exclude source maps and capture added and removed assets', async () => {
  const directory = await temporary()
  await writeFile(join(directory, 'main.js'), 'console.log(1)')
  await writeFile(join(directory, 'main.js.map'), '{}')
  await mkdir(join(directory, 'nested'))
  await writeFile(join(directory, 'nested', 'module.mjs'), 'export default 1')
  const assets = await collectBundles(directory)
  expect(assets.map((asset) => asset.path)).toEqual(['main.js', 'nested/module.mjs'])
  expect(assets[0]!.bytes).toBe(14)
  expect(
    bundleChanges([{ path: 'removed.js', bytes: 5, gzip: 20, brotli: 10 }], [{ path: 'added.js', bytes: 10, gzip: 25, brotli: 15 }]).map(
      (asset) => asset.status,
    ),
  ).toEqual(['added', 'removed'])
})

test('report survives missing and malformed artifacts, preserves evidence, and escapes diagnostics', async () => {
  const directory = await temporary()
  const input = join(directory, 'input')
  const output = join(directory, 'report')
  const data = result()
  data.diagnostics.push('<script>unsafe</script>')
  await writeJson(join(input, 'valid', 'result.json'), data)
  await mkdir(join(input, 'invalid'))
  await writeFile(join(input, 'invalid', 'result.json'), '{broken')
  const summary = await generateReport({
    input,
    output,
    benchmarks: [benchmark, selectBenchmarks('startup-empty-cold-timing')[0]!],
    commits,
  })
  expect(summary.usable).toBe(true)
  expect(summary.coverage.map((entry) => entry.status)).toEqual(['success', 'missing'])
  expect(summary.diagnostics).toHaveLength(1)
  const html = await readFile(join(output, 'index.html'), 'utf8')
  expect(html).toContain('&lt;script&gt;unsafe&lt;/script&gt;')
  expect(html).not.toContain('<script>unsafe</script>')
  expect(await readFile(join(output, 'data', benchmark.id, 'result.json'), 'utf8')).toContain('schemaVersion')
  expect(await readFile(join(input, 'valid', 'result.json'), 'utf8')).toContain('schemaVersion')
})

test('report is still written when no valid runtime comparison or build is available', async () => {
  const directory = await temporary()
  const summary = await generateReport({
    input: join(directory, 'absent'),
    output: join(directory, 'report'),
    benchmarks: [benchmark],
    commits,
    buildOutcomes: 'failure,failure',
  })
  expect(summary.usable).toBe(false)
  expect(summary.coverage[0]!.status).toBe('missing')
  expect(await readFile(join(directory, 'report', 'index.html'), 'utf8')).toContain('Comparison incomplete')
})

test('build extraction checks commit and archive integrity and preserves executable permissions', async () => {
  const directory = await temporary()
  const source = join(directory, 'source')
  const executable = join(source, 'VSCode-linux-x64', 'code-oss')
  await mkdir(join(source, 'VSCode-linux-x64'), { recursive: true })
  await writeFile(executable, '#!/bin/sh\nexit 0\n')
  await chmod(executable, 0o755)
  const archive = join(directory, 'vscode.tar.gz')
  await command('tar', ['-czf', archive, '-C', source, 'VSCode-linux-x64'])
  await writeJson(join(directory, 'build.json'), {
    schemaVersion: 1,
    commit: commits.before,
    platform: 'linux',
    arch: 'x64',
    executable: 'VSCode-linux-x64/code-oss',
    archiveSha256: await sha256(archive),
  })
  await expect(extractBuild(directory, commits.after)).rejects.toThrow('metadata')
  const extracted = await extractBuild(directory, commits.before)
  expect((await stat(extracted)).mode & 0o111).toBe(0o111)
  expect(await readFile(extracted, 'utf8')).toBe('#!/bin/sh\nexit 0\n')
  await writeFile(archive, 'corrupted archive')
  await expect(extractBuild(directory, commits.before)).rejects.toThrow('checksum mismatch')
})

test('a broken profile chart does not prevent unrelated comparisons or report publication', async () => {
  const directory = await temporary()
  const input = join(directory, 'input')
  const output = join(directory, 'report')
  const profileBenchmark = selectBenchmarks('open-small-profile')[0]!
  const profile = { ...result(), benchmark: profileBenchmark }
  profile.samples[0]!.raw = ['broken.cpuprofile']
  await writeJson(join(input, 'timing', 'result.json'), result())
  await writeJson(join(input, 'profile', 'result.json'), profile)
  await writeFile(join(input, 'profile', 'broken.cpuprofile'), '{}')
  const summary = await generateReport({ input, output, benchmarks: [benchmark, profileBenchmark], commits })
  expect(summary.usable).toBe(true)
  expect(summary.comparisons).toHaveLength(2)
  expect(summary.diagnostics.some((message) => message.includes('Profile open-small-profile'))).toBe(true)
  expect(await readFile(join(output, 'charts', 'open-small-timing-actionTime.svg'), 'utf8')).toContain('complete pairs')
})

test('reports reject unknown benchmark identities and overlapping input/output directories', async () => {
  const directory = await temporary()
  await expect(generateReport({ input: directory, output: join(directory, 'report'), benchmarks: [benchmark], commits })).rejects.toThrow(
    'separate',
  )
  await expect(
    generateReport({ input: directory, output: directory + '-report', benchmarks: [{ ...benchmark, id: '../../escape' }], commits }),
  ).rejects.toThrow('Unknown benchmark')
})
