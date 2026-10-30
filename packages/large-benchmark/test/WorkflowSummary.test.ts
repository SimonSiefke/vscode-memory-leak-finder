import { afterEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeJson } from '../src/parts/Io/Io.ts'
import { largePerformance } from '../src/parts/Main/Main.ts'
import { selectBenchmarks } from '../src/parts/Manifest/Manifest.ts'
import type { Comparison } from '../src/parts/Report/Report.ts'
import { comparePairs } from '../src/parts/Statistics/Statistics.ts'
import type { Result } from '../src/parts/Types/Types.ts'
import { createWorkflowSummary } from '../src/parts/WorkflowSummary/WorkflowSummary.ts'

const commits = { before: 'a'.repeat(40), after: 'b'.repeat(40) }
const comparison = (overrides: Partial<Comparison> = {}): Comparison => ({
  benchmark: 'open-small-timing',
  scenario: 'open-small',
  collector: 'timing',
  startup: false,
  cache: 'action',
  metric: 'actionTime',
  unit: 'ms',
  coverage: 'renderer',
  higherIsBetter: false,
  statistics: comparePairs([10, 11, 12, 13, 100], [5, 6, 7, 8, 50], 'median'),
  ...overrides,
})
const summary = (comparisons: Comparison[]) => ({ commits, comparisons, coverage: [], usable: true })

test('summary lists every metric by collector with primary values, signed changes, units, pairs, and confidence intervals', () => {
  const timing = comparison()
  const bytes = comparison({
    benchmark: 'open-small-memory',
    collector: 'memory',
    metric: 'heapBytes',
    unit: 'bytes',
    statistics: comparePairs([10, 11, 12, 13, 100], [5, 6, 7, 8, 50], 'mean'),
  })
  const markdown = createWorkflowSummary(summary([timing, bytes]))
  expect(markdown).toContain(`Before: <code>${commits.before}</code>`)
  expect(markdown).toContain(`After: <code>${commits.after}</code>`)
  expect(markdown).toContain('### timing\n\n| Benchmark |')
  expect(markdown).toContain('### memory\n\n| Benchmark |')
  expect(markdown).toContain('| open-small-timing | actionTime (renderer) | 12 ms | 7 ms | -5 ms (-41.667%) | 5 |')
  expect(markdown).toContain('| open-small-memory | heapBytes (renderer) | 29.2 bytes | 15.2 bytes | -14 bytes (-47.945%) | 5 |')
  expect(markdown).toContain('95% paired CI of change')
  expect(markdown).toContain('| Improvement |')
})

test('summary handles zero baselines, uncertain results, higher-is-better metrics, and static bundle comparisons', () => {
  const markdown = createWorkflowSummary(
    summary([
      comparison({ metric: 'zero', statistics: comparePairs([0, 0], [1, 1], 'mean') }),
      comparison({ metric: 'throughput', higherIsBetter: true, statistics: comparePairs([1, 1, 1, 1, 1], [2, 2, 2, 2, 2], 'mean') }),
      comparison({ metric: 'slower', statistics: comparePairs([1, 1, 1, 1, 1], [2, 2, 2, 2, 2], 'mean') }),
      comparison({ collector: 'bundles', unit: 'bytes', statistics: { ...comparePairs([10], [10], 'mean'), inconclusive: false } }),
    ]),
  )
  expect(markdown).toContain('| 0 ms | 1 ms | +1 ms (N/A) | 2 | 1 to 1 ms | Inconclusive |')
  expect(markdown).toContain('| throughput (renderer) | 1 ms | 2 ms | +1 ms (+100%) | 5 | 1 to 1 ms | Improvement |')
  expect(markdown).toContain('| slower (renderer) | 1 ms | 2 ms | +1 ms (+100%) | 5 | 1 to 1 ms | Regression |')
  expect(markdown).toContain('| 10 bytes | 10 bytes | 0 bytes (0%) | 1 | Static | Unchanged |')
})

test('summary escapes artifact labels without allowing them to break tables or inject HTML', () => {
  const markdown = createWorkflowSummary(summary([comparison({ metric: 'a|b\n<script>`_*[x]\\' })]))
  expect(markdown).toContain('a&#124;b &#60;script&#62;&#96;&#95;&#42;&#91;x&#93;&#92;')
  expect(markdown).not.toContain('<script>')
})

const directories: string[] = []
afterEach(async () => {
  jest.restoreAllMocks()
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

test.each([true, false])(
  'report command appends actual paired results and coverage to the Actions summary (available: %s)',
  async (available) => {
    const directory = await mkdtemp(join(tmpdir(), 'workflow-summary-test-'))
    directories.push(directory)
    const input = join(directory, 'input')
    const manifest = join(directory, 'manifest.json')
    const output = join(directory, 'report')
    const summaryPath = join(directory, 'step-summary.md')
    const benchmark = selectBenchmarks('open-small-timing')[0]!
    const missing = selectBenchmarks('open-small-instructions')[0]!
    await writeJson(manifest, { schemaVersion: 1, commits, samples: 5, benchmarks: [benchmark, missing] })
    if (available) {
      const result: Result = {
        schemaVersion: 1,
        benchmark,
        commits,
        requestedSamples: 5,
        status: 'partial',
        runner: {},
        diagnostics: [],
        samples: Array.from({ length: 5 }, (_, pair) =>
          (['before', 'after'] as const).map((revision, order) => ({
            pair,
            revision,
            order,
            status: pair === 4 && revision === 'after' ? ('failed' as const) : ('success' as const),
            metrics: [{ name: 'actionTime', unit: 'ms', coverage: 'renderer', value: revision === 'before' ? 10 : 5 }],
            raw: [],
            diagnostics: [],
            elapsedMs: 1,
          })),
        ).flat(),
      }
      await writeJson(join(input, benchmark.id, 'result.json'), result)
    }
    await writeFile(summaryPath, 'Existing summary\n\n')
    const previous = process.env.GITHUB_STEP_SUMMARY
    process.env.GITHUB_STEP_SUMMARY = summaryPath
    jest.spyOn(console, 'log').mockImplementation(() => {})
    try {
      const report = largePerformance(['report', '--manifest', manifest, '--input-dir', input, '--output-dir', output])
      if (available) await report
      else await expect(report).rejects.toThrow('no valid runtime comparisons')
    } finally {
      if (previous === undefined) delete process.env.GITHUB_STEP_SUMMARY
      else process.env.GITHUB_STEP_SUMMARY = previous
    }
    const markdown = await readFile(summaryPath, 'utf8')
    expect(markdown).toContain('Existing summary\n\n## Large Performance')
    expect(markdown).toContain('| open-small-instructions | missing | 0/? |')
    if (available) {
      expect(markdown).toContain('| actionTime (renderer) | 10 ms | 5 ms | -5 ms (-50%) | 4 |')
      expect(markdown).toContain('| open-small-timing | partial | 4/5 |')
    } else {
      expect(markdown).toContain('**Comparison incomplete:**')
      expect(markdown).toContain('No paired metric results are available.')
    }
  },
)
