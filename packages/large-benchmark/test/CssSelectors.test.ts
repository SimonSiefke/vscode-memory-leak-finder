import { afterEach, expect, test } from '@jest/globals'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { analyzeSelectorTrace } from '../src/parts/CssSelectors/CssSelectors.ts'
import { selectorComparisons, selectorDetailsSvg } from '../src/parts/CssSelectorReport/CssSelectorReport.ts'
import { sampleCount, selectBenchmarks } from '../src/parts/Manifest/Manifest.ts'
import { generateReport, validateResult } from '../src/parts/Report/Report.ts'
import { generateTrendReport } from '../src/parts/TrendReport/TrendReport.ts'
import { writeJson } from '../src/parts/Io/Io.ts'
import type { Result, SelectorStatsRow } from '../src/parts/Types/Types.ts'

const benchmark = selectBenchmarks('', 'css-selectors')[0]!
const commits = ['a'.repeat(40), 'b'.repeat(40), 'c'.repeat(40)]
const row = (selector: string, elapsedMs: number): SelectorStatsRow => ({
  selector,
  elapsedMs,
  matchAttempts: 1,
  matchCount: 1,
  invalidationCount: 0,
})
const trace = (selector: string, elapsed: number, ts = 20, pid = 1, sheet = '1') => ({
  name: 'SelectorStats',
  ts,
  pid,
  tid: 1,
  args: {
    selector_stats: {
      selector_timings: [
        { selector, style_sheet_id: sheet, 'elapsed (us)': elapsed, match_attempts: 2, match_count: 1, invalidation_count: 0 },
      ],
    },
  },
})
const boundaries = [
  { name: 'ParseHTML', ts: 1, pid: 1, tid: 1 },
  { name: 'TimeStamp', ts: 100, pid: 1, tid: 1, args: { data: { message: 'large-end' } } },
]
const result = (): Result => ({
  schemaVersion: 1,
  benchmark,
  commits: { before: commits[0]!, after: commits[1]! },
  requestedSamples: 2,
  status: 'success',
  runner: {},
  diagnostics: [],
  samples: [0, 1].flatMap((pair) =>
    (['before', 'after'] as const).map((revision, order) => ({
      pair,
      revision,
      order,
      status: 'success' as const,
      metrics: [{ name: 'totalElapsedMs', value: revision === 'before' ? 10 : 20, unit: 'ms', coverage: 'CSS selectors' }],
      selectorStats: revision === 'before' ? [row('.removed', 10), row('.common', 1)] : [row('.added', 20), row('.common', 2)],
      raw: [],
      diagnostics: [],
      elapsedMs: 1,
    })),
  ),
})
const directories: string[] = []
afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

test('CSS selection measures four diagnostic startup workloads with bounded samples', () => {
  const selected = selectBenchmarks('', 'css-selectors')
  expect(selected).toHaveLength(4)
  expect(selected.every((entry) => entry.startup && entry.diagnostic)).toBe(true)
  expect(sampleCount(benchmark, 37)).toBe(5)
})

test('startup selector collection clips at readiness, isolates the workbench, combines sheets and retains more than 3000 rows', () => {
  const stats = analyzeSelectorTrace([
    ...boundaries,
    trace('.same', 1000),
    trace('.same', 2000, 30, 1, '99'),
    trace('.late', 90000, 101),
    trace('.other-process', 90000, 20, 2),
    ...Array.from({ length: 3001 }, (_, i) => trace(`.s${i}`, 100)),
  ])
  expect(stats.selectors).toHaveLength(3002)
  expect(stats.selectors[0]).toMatchObject({ selector: '.same', elapsedMs: 3, matchAttempts: 4 })
  expect(stats.metrics.find((metric) => metric.name === 'totalElapsedMs')!.value).toBeCloseTo(303.1)
  expect(stats.selectors.some((row) => row.selector === '.late' || row.selector === '.other-process')).toBe(false)
})

test('absent instrumentation, malformed stats and missing initialization/boundaries are unavailable', () => {
  expect(() => analyzeSelectorTrace(boundaries)).toThrow('no CSS selector')
  expect(() => analyzeSelectorTrace([...boundaries, { name: 'SelectorStats', ts: 20, pid: 1, args: { selector_stats: {} } }])).toThrow(
    'format',
  )
  expect(() => analyzeSelectorTrace([trace('.x', 1)])).toThrow('boundary')
  expect(() => analyzeSelectorTrace([boundaries[1], trace('.x', 1)])).toThrow('initialization')
})

test('details align the union, rank the slower revision first, include additions/removals and exclude incomplete pairs', () => {
  const data = result()
  data.samples.push({ ...data.samples[0]!, pair: 2, selectorStats: [row('.ignore', 99999)] })
  data.requestedSamples = 3
  expect(selectorComparisons(data)).toEqual({
    pairs: 2,
    totalSelectors: 3,
    rows: [
      { selector: '.added', before: 0, after: 20 },
      { selector: '.removed', before: 10, after: 0 },
      { selector: '.common', before: 1, after: 2 },
    ],
  })
  data.samples[0]!.status = 'failed'
  expect(selectorComparisons(data).pairs).toBe(1)
  data.samples[2]!.selectorStats = undefined as any
  expect(selectorComparisons(data).rows).toEqual([])
})

test('ranking happens after aggregation without per-sample truncation and charts cap at 3000 escaped selectors', () => {
  const data = result()
  for (const sample of data.samples) sample.selectorStats = Array.from({ length: 3005 }, (_, i) => row(`.selector-${i}`, i))
  data.samples[0]!.selectorStats!.push(row('<unsafe & selector>', 99999))
  data.samples[2]!.selectorStats!.push(row('<unsafe & selector>', 99999))
  const details = selectorComparisons(data)
  expect(details.rows).toHaveLength(3000)
  expect(details.totalSelectors).toBe(3006)
  expect(details.rows[0]!.selector).toBe('<unsafe & selector>')
  const svg = selectorDetailsSvg(data)
  expect(svg).toContain('&lt;unsafe &amp; selector&gt;')
  expect(svg).not.toContain('<unsafe & selector>')
  expect(svg.match(/<rect x="670"/g)).toHaveLength(6000)
  expect(svg).toContain('Top 3000 of 3006')
})

test('result validation rejects malformed selector values', () => {
  const data = result()
  data.samples[0]!.selectorStats![0]!.elapsedMs = NaN
  expect(() => validateResult(data, benchmark, data.commits)).toThrow('CSS selector')
})

test('offline pair and version-series reports include totals, selector details and total trends', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'css-selector-report-'))
  directories.push(directory)
  const input = join(directory, 'input')
  const data = result()
  await writeJson(join(input, 'first', 'result.json'), data)
  await writeJson(join(input, 'second', 'result.json'), { ...data, commits: { before: commits[1], after: commits[2] } })
  const output = join(directory, 'pair')
  const pair = await generateReport({
    input,
    output,
    benchmarks: [benchmark],
    commits: data.commits,
    resultPaths: [join(input, 'first', 'result.json')],
  })
  expect(pair.diagnostics).toEqual([])
  expect(await readFile(join(output, 'charts', `${benchmark.id}-totals.svg`), 'utf8')).toContain('Before')
  expect(await readFile(join(output, 'charts', `${benchmark.id}-details.svg`), 'utf8')).toContain('.added')
  expect(await readFile(join(output, 'index.html'), 'utf8')).toContain('Selector details')
  const seriesOutput = join(directory, 'series')
  const series = await generateTrendReport({
    input,
    output: seriesOutput,
    manifest: { schemaVersion: 2, commits, samples: 2, benchmarks: [benchmark] },
  })
  expect(series.trends[0]!.points).toEqual([100, 200, 400])
  expect(await readFile(join(seriesOutput, 'pair-2', 'charts', `${benchmark.id}-details.svg`), 'utf8')).toContain('.removed')
})

test('empty Chromium SelectorStats spans are valid and unsupported invalidation counts are omitted', () => {
  const event = trace('.x', 123)
  const timing: any = event.args.selector_stats.selector_timings[0]!
  delete timing.invalidation_count
  timing.fast_reject_count = 1
  const stats = analyzeSelectorTrace([...boundaries, { name: 'SelectorStats', ts: 25, pid: 1, args: {} }, event])
  expect(stats.selectors).toHaveLength(1)
  expect(stats.metrics.some((metric) => metric.name === 'invalidationCount')).toBe(false)
  expect(stats.metrics.find((metric) => metric.name === 'fastRejectCount')!.value).toBe(1)
  expect(() => analyzeSelectorTrace([...boundaries, { name: 'SelectorStats', ts: 25, pid: 1, args: {} }])).toThrow(
    'no CSS selector timing rows',
  )
})
