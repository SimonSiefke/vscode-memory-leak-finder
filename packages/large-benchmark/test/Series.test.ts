import { afterEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { writeJson } from '../src/parts/Io/Io.ts'
import { largePerformance } from '../src/parts/Main/Main.ts'
import { benchmarks, selectBenchmarks } from '../src/parts/Manifest/Manifest.ts'
import { commitPairs, parseCommits, seriesMatrix, type SeriesManifest } from '../src/parts/Series/Series.ts'
import { generateTrendReport, trendsFor, trendSvg } from '../src/parts/TrendReport/TrendReport.ts'
import type { Result } from '../src/parts/Types/Types.ts'

const commits = ['a'.repeat(40), 'b'.repeat(40), 'c'.repeat(40)]
const benchmark = selectBenchmarks('', 'startup-times')[0]!
const directories: string[] = []
const temporary = async (): Promise<string> => {
  const path = await mkdtemp(join(tmpdir(), 'performance-series-test-'))
  directories.push(path)
  return path
}
afterEach(async () => {
  jest.restoreAllMocks()
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

const manifest = (): SeriesManifest => ({ schemaVersion: 2, commits, samples: 5, benchmarks: [benchmark] })
const result = (pairIndex: number, before: number, after: number): Result => ({
  schemaVersion: 1,
  benchmark,
  commits: { before: commits[pairIndex]!, after: commits[pairIndex + 1]! },
  requestedSamples: 5,
  status: 'success',
  runner: {},
  diagnostics: [],
  samples: Array.from({ length: 5 }, (_, pair) =>
    (['before', 'after'] as const).map((revision, order) => ({
      pair,
      revision,
      order,
      status: 'success' as const,
      metrics: [{ name: 'startupTime', unit: 'ms', coverage: 'workbench', value: revision === 'before' ? before : after }],
      diagnostics: [],
      raw: [],
      elapsedMs: 1,
    })),
  ).flat(),
})

test('commit arrays preserve order, normalize case, and reject malformed, repeated, or oversized input', () => {
  expect(parseCommits(JSON.stringify([commits[2], commits[0]!.toUpperCase()]))).toEqual([commits[2], commits[0]])
  for (const input of [
    'bad-json',
    '{}',
    'null',
    '[]',
    '[123,456]',
    JSON.stringify([commits[0]]),
    JSON.stringify([commits[0], 'abc']),
    JSON.stringify([commits[0], commits[0]!.toUpperCase()]),
    JSON.stringify(Array(257).fill(commits[0])),
  ])
    expect(() => parseCommits(input)).toThrow()
  expect(commitPairs(commits)).toEqual([
    { id: 'pair-1', before: commits[0], after: commits[1] },
    { id: 'pair-2', before: commits[1], after: commits[2] },
  ])
})

test('measure selection supports startup times, unions of groups, and intersection with exact IDs', () => {
  expect(selectBenchmarks('', 'startup-times').map((entry) => entry.id)).toEqual([
    'startup-empty-cold-timing',
    'startup-empty-warm-timing',
    'startup-workspace-cold-timing',
    'startup-workspace-warm-timing',
  ])
  expect(selectBenchmarks('', 'startup')).toHaveLength(24)
  expect(selectBenchmarks('', 'timing, memory')).toHaveLength(32)
  expect(selectBenchmarks(benchmark.id + ',open-small-timing', 'startup-times')).toEqual([benchmark])
  expect(() => selectBenchmarks('', 'startp')).toThrow('Unknown measures')
  expect(() => selectBenchmarks('bundles', 'startup-times')).toThrow('No benchmarks match')
  expect(selectBenchmarks()).toEqual(benchmarks)
})

test.each([2, 3, 100, 256])('matrix covers every adjacent pair and benchmark once within 256 jobs (%s versions)', (count) => {
  const versions = Array.from({ length: count }, (_, index) => index.toString(16).padStart(40, '0'))
  for (const selected of [benchmarks, selectBenchmarks('', 'startup-times')]) {
    const matrix = seriesMatrix(versions, selected).include
    expect(matrix.length).toBeLessThanOrEqual(256)
    expect(new Set(matrix.map((job) => `${job.id}-${job.group}`)).size).toBe(matrix.length)
    const tasks = matrix.flatMap((job) => job.benchmarks.split(',').map((id) => `${job.before}:${job.after}:${id}`))
    const expected = commitPairs(versions).flatMap((pair) => selected.map((entry) => `${pair.before}:${pair.after}:${entry.id}`))
    expect(tasks.sort()).toEqual(expected.sort())
  }
})

test('matrix command emits build and measurement matrices and supports legacy before/after inputs', async () => {
  const directory = await temporary()
  const githubOutput = join(directory, 'github-output')
  const previous = process.env.GITHUB_OUTPUT
  process.env.GITHUB_OUTPUT = githubOutput
  try {
    await largePerformance([
      'matrix',
      '--commits',
      JSON.stringify(commits),
      '--measures',
      'startup-times',
      '--output-dir',
      join(directory, 'series'),
    ])
    const outputs = Object.fromEntries(
      (await readFile(githubOutput, 'utf8'))
        .trim()
        .split('\n')
        .map((line) => [line.slice(0, line.indexOf('=')), JSON.parse(line.slice(line.indexOf('=') + 1))]),
    )
    expect(outputs.build_matrix).toEqual({ include: commits.map((commit) => ({ commit, artifact: commit })) })
    expect(outputs.matrix.include).toHaveLength(8)
    expect(JSON.parse(await readFile(join(directory, 'series', 'manifest.json'), 'utf8'))).toMatchObject({ schemaVersion: 2, commits })
    await largePerformance([
      'matrix',
      '--before-commit',
      commits[0]!,
      '--after-commit',
      commits[1]!,
      '--measures',
      'startup-times',
      '--output-dir',
      join(directory, 'legacy'),
    ])
    expect(JSON.parse(await readFile(join(directory, 'legacy', 'manifest.json'), 'utf8'))).toMatchObject({
      schemaVersion: 1,
      commits: { before: commits[0], after: commits[1] },
    })
    await expect(largePerformance(['matrix', '--commits', JSON.stringify(commits), '--before-commit', commits[0]!])).rejects.toThrow(
      'cannot be combined',
    )
  } finally {
    if (previous === undefined) delete process.env.GITHUB_OUTPUT
    else process.env.GITHUB_OUTPUT = previous
  }
})

test('series report keeps pair identities separate and chains relative changes across different runners', async () => {
  const directory = await temporary()
  const input = join(directory, 'input')
  const output = join(directory, 'report')
  // The second runner is twice as slow; its within-runner improvement is still 25%.
  await writeJson(join(input, 'large-result-pair-1-1', 'result.json'), result(0, 100, 120))
  await writeJson(join(input, 'large-result-pair-2-1', benchmark.id, 'result.json'), result(1, 240, 180))
  const summary = await generateTrendReport({ input, output, manifest: manifest() })
  expect(summary.usable).toBe(true)
  expect(summary.diagnostics).toEqual([])
  expect(summary.reports.map((report) => report.diagnostics)).toEqual([[], []])
  expect(summary.trends[0]!.points).toEqual([100, 120, 90])
  expect(summary.trends[0]!.overallPercent).toBe(-10)
  const html = await readFile(join(output, 'index.html'), 'utf8')
  expect(html).toContain('Regression')
  expect(html).toContain('Improvement')
  expect(html).toContain('Overall chained change: <strong>-10%')
  for (const path of ['index.html', 'pair-1/index.html', 'pair-2/index.html']) {
    const page = join(output, path)
    const content = await readFile(page, 'utf8')
    for (const [, link] of content.matchAll(/(?:src|href)="([^"#]+)(?:#[^"]*)?"/g))
      await expect(stat(join(dirname(page), decodeURIComponent(link!)))).resolves.toBeDefined()
  }
  expect(await readFile(join(output, 'pair-2', 'index.html'), 'utf8')).toContain('large-result-pair-2-1')
  const chart = await readFile(join(output, 'charts', 'trend-1.svg'), 'utf8')
  expect(chart).toContain(commits[2]!)
  expect(chart).not.toMatch(/NaN|Infinity/)
  // Each metric is separate even when its name is shared by a different coverage or unit.
  const reports = structuredClone(summary.reports)
  reports[1]!.comparisons[0]!.unit = 'bytes'
  expect(trendsFor(reports)).toHaveLength(2)
  expect(trendsFor(reports).every((trend) => trend.overallPercent === null)).toBe(true)
})

test('missing or zero-baseline links restart the plotted range without claiming an overall change', async () => {
  const directory = await temporary()
  const input = join(directory, 'input')
  await writeJson(join(input, 'second', 'result.json'), result(1, 200, 100))
  await writeFile(join(input, 'result.json'), '{broken')
  const summary = await generateTrendReport({ input, output: join(directory, 'report'), manifest: manifest() })
  expect(summary.usable).toBe(false)
  expect(summary.diagnostics).toHaveLength(1)
  expect(summary.trends[0]!.points).toEqual([null, 100, 50])
  expect(summary.trends[0]!.changes[1]!.statistics.percentChange).toBe(-50)
  expect(summary.trends[0]!.overallPercent).toBeNull()
  const chart = await readFile(join(directory, 'report', 'charts', 'trend-1.svg'), 'utf8')
  expect(chart.match(/<circle /g)).toHaveLength(2)
  expect(chart.match(/stroke="#5479e8"/g)).toHaveLength(1)
  expect(chart).toContain('each measured range starts at 100')
  const zero = result(0, 0, 10)
  await writeJson(join(input, 'first', 'result.json'), zero)
  const zeroSummary = await generateTrendReport({ input, output: join(directory, 'zero-report'), manifest: manifest() })
  expect(zeroSummary.trends[0]!.points).toEqual([null, 100, 50])
  expect(zeroSummary.trends[0]!.overallPercent).toBeNull()
  expect(await readFile(join(directory, 'zero-report', 'charts', 'trend-1.svg'), 'utf8')).not.toMatch(/NaN|Infinity/)
})

test('separate measured ranges remain visible without drawing lines across missing links', async () => {
  const directory = await temporary()
  const input = join(directory, 'input')
  await writeJson(join(input, 'first', 'result.json'), result(0, 100, 120))
  await writeJson(join(input, 'second', 'result.json'), result(1, 200, 100))
  const summary = await generateTrendReport({ input, output: join(directory, 'report'), manifest: manifest() })
  const first = summary.reports[0]!
  const second = summary.reports[1]!
  const missing = { ...first, comparisons: [] }
  const [trend] = trendsFor([first, missing, second])
  expect(trend!.points).toEqual([100, 120, 100, 50])
  expect(trend!.overallPercent).toBeNull()
  const chart = trendSvg(trend!, [...commits, 'd'.repeat(40)])
  expect(chart.match(/<circle /g)).toHaveLength(4)
  expect(chart.match(/stroke="#5479e8"/g)).toHaveLength(2)
  expect(chart).toContain('Missing links separate ranges')
  expect(trendsFor([missing, missing, second, missing])[0]!.points).toEqual([null, null, 100, 50, null])
  expect(trendsFor([missing, missing, second, missing])[0]!.overallPercent).toBeNull()
})

test.each([0, 1])('series CLI succeeds with a partial report when only comparison %s is available', async (pairIndex) => {
  const directory = await temporary()
  const input = join(directory, 'input')
  const manifestPath = join(directory, 'manifest.json')
  const output = join(directory, 'report')
  const summaryPath = join(directory, 'summary.md')
  await writeJson(manifestPath, manifest())
  await writeJson(join(input, 'available', 'result.json'), result(pairIndex, 100, 120))
  const failedCommit = commits[pairIndex === 0 ? 2 : 0]
  await writeJson(join(input, `large-build-status-${failedCommit}`, 'status.json'), {
    status: 'failed',
    commit: failedCommit,
    error: 'Build failed',
  })
  const previous = process.env.GITHUB_STEP_SUMMARY
  process.env.GITHUB_STEP_SUMMARY = summaryPath
  jest.spyOn(console, 'log').mockImplementation(() => {})
  try {
    await expect(
      largePerformance(['report', '--manifest', manifestPath, '--input-dir', input, '--output-dir', output]),
    ).resolves.toBeUndefined()
  } finally {
    if (previous === undefined) delete process.env.GITHUB_STEP_SUMMARY
    else process.env.GITHUB_STEP_SUMMARY = previous
  }
  expect(await readFile(join(output, 'index.html'), 'utf8')).toContain('Comparison incomplete')
  const markdown = await readFile(summaryPath, 'utf8')
  expect(markdown).toContain('3 commits; 2 adjacent comparisons')
  expect(markdown).toContain('| Unavailable | 1/2 |')
  expect(markdown).toContain('**Comparison incomplete:**')
  const pairHtml = await readFile(join(output, `pair-${pairIndex + 1}`, 'index.html'), 'utf8')
  expect(pairHtml).toContain('startupTime')
  expect(pairHtml).toContain('Build failed')
})

test('series CLI fails when no comparisons are usable while preserving the report and workflow summary', async () => {
  const directory = await temporary()
  const manifestPath = join(directory, 'manifest.json')
  const output = join(directory, 'report')
  const summaryPath = join(directory, 'summary.md')
  await writeJson(manifestPath, manifest())
  const previous = process.env.GITHUB_STEP_SUMMARY
  process.env.GITHUB_STEP_SUMMARY = summaryPath
  jest.spyOn(console, 'log').mockImplementation(() => {})
  try {
    await expect(
      largePerformance(['report', '--manifest', manifestPath, '--input-dir', join(directory, 'absent'), '--output-dir', output]),
    ).rejects.toThrow('no usable revision comparisons')
  } finally {
    if (previous === undefined) delete process.env.GITHUB_STEP_SUMMARY
    else process.env.GITHUB_STEP_SUMMARY = previous
  }
  expect(await readFile(join(output, 'index.html'), 'utf8')).toContain('No paired metric results are available.')
  expect(await readFile(summaryPath, 'utf8')).toContain('**Comparison incomplete:**')
})

test('bundle-only selections are usable while bundles do not mask missing requested runtime measurements', async () => {
  const directory = await temporary()
  const input = join(directory, 'input')
  const bundle = selectBenchmarks('', 'bundles')[0]!
  for (const index of [0, 1]) {
    const data = result(index, 100, 120)
    data.benchmark = bundle
    for (const sample of data.samples) sample.metrics[0]!.unit = 'bytes'
    await writeJson(join(input, `pair-${index}`, 'result.json'), data)
    await writeJson(join(input, `pair-${index}`, 'bundle-changes.json'), [])
  }
  const onlyBundles = await generateTrendReport({
    input,
    output: join(directory, 'bundles'),
    manifest: { ...manifest(), benchmarks: [bundle] },
  })
  expect(onlyBundles.usable).toBe(true)
  expect(await readFile(join(directory, 'bundles', 'index.html'), 'utf8')).toContain('<td>Static</td>')
  const missingRuntime = await generateTrendReport({
    input,
    output: join(directory, 'missing'),
    manifest: { ...manifest(), benchmarks: [bundle, benchmark] },
  })
  expect(missingRuntime.usable).toBe(false)
})

test('series reports reject overlapping directories before writing', async () => {
  const directory = await temporary()
  for (const [input, output] of [
    [directory, directory],
    [directory, join(directory, 'report')],
    [join(directory, 'input'), directory],
  ])
    await expect(generateTrendReport({ input: input!, output: output!, manifest: manifest() })).rejects.toThrow('separate directories')
})

test.each(['pair', 'series'])('qualified fork references survive the %s workflow matrices and offline report', async (mode) => {
  const directory = await temporary()
  const before = `microsoft/vscode@${commits[0]}`
  const after = `simonsiefke/vscode@${commits[1]}`
  const previous = process.env.GITHUB_OUTPUT
  const githubOutput = join(directory, 'github-output')
  process.env.GITHUB_OUTPUT = githubOutput
  try {
    await largePerformance([
      'matrix',
      ...(mode === 'series' ? ['--commits', JSON.stringify([before, after])] : ['--before-commit', before, '--after-commit', after]),
      '--benchmark-filter',
      benchmark.id,
      '--output-dir',
      join(directory, 'manifest'),
    ])
  } finally {
    if (previous === undefined) delete process.env.GITHUB_OUTPUT
    else process.env.GITHUB_OUTPUT = previous
  }
  const outputs = Object.fromEntries(
    (await readFile(githubOutput, 'utf8'))
      .trim()
      .split('\n')
      .map((line) => [line.slice(0, line.indexOf('=')), JSON.parse(line.slice(line.indexOf('=') + 1))]),
  )
  expect(outputs.build_matrix).toEqual({
    include: [
      { commit: before, artifact: commits[0] },
      { commit: after, artifact: `simonsiefke-vscode-${commits[1]}` },
    ],
  })
  expect(outputs.matrix.include[0]).toMatchObject({
    before,
    after,
    beforeArtifact: commits[0],
    afterArtifact: `simonsiefke-vscode-${commits[1]}`,
  })
  const data = { ...result(0, 100, 90), commits: { before, after } }
  await writeJson(join(directory, 'input', 'large-result-pair-1-1', 'result.json'), data)
  jest.spyOn(console, 'log').mockImplementation(() => {})
  await largePerformance([
    'report',
    '--manifest',
    join(directory, 'manifest', 'manifest.json'),
    '--input-dir',
    join(directory, 'input'),
    '--output-dir',
    join(directory, 'report'),
  ])
  const html = await readFile(join(directory, 'report', 'index.html'), 'utf8')
  expect(html).toContain(before)
  expect(html).toContain(after)
  expect(html).toContain('startupTime')
})
