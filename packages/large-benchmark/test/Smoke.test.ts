import { afterEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeJson } from '../src/parts/Io/Io.ts'
import { largePerformance } from '../src/parts/Main/Main.ts'
import { selectBenchmarks } from '../src/parts/Manifest/Manifest.ts'
import { compareSmoke, runSmoke, smokeComparison, reportSmoke, type SmokeResult } from '../src/parts/Smoke/Smoke.ts'
import { generateReport } from '../src/parts/Report/Report.ts'
import { createWorkflowSummary } from '../src/parts/WorkflowSummary/WorkflowSummary.ts'

const commits = { before: 'a'.repeat(40), after: 'b'.repeat(40) }
const directories: string[] = []
const temporary = async () => {
  const path = await mkdtemp(join(tmpdir(), 'smoke-benchmark-'))
  directories.push(path)
  return path
}
afterEach(async () => {
  jest.restoreAllMocks()
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
const result = (commit: string, values: number[]): SmokeResult => ({
  schemaVersion: 1,
  commit,
  harnessCommit: commits.before,
  fixtureCommit: 'c'.repeat(40),
  requestedSamples: values.length,
  runner: { hostname: 'test', node: process.version },
  samples: values.map((elapsedMs, index) => ({ index, elapsedMs, status: 'success', tests: ['suite test'], pending: 0 })),
})

test('smoke-only selection creates two builds and two independent jobs, defaulting to 37 attempts', async () => {
  const output = await temporary()
  const previous = process.env.GITHUB_OUTPUT
  process.env.GITHUB_OUTPUT = join(output, 'outputs')
  try {
    await largePerformance([
      'matrix',
      '--before-commit',
      commits.before,
      '--after-commit',
      commits.after,
      '--measures',
      'smoke',
      '--output-dir',
      output,
    ])
    const outputs = Object.fromEntries(
      (await readFile(process.env.GITHUB_OUTPUT, 'utf8'))
        .trim()
        .split('\n')
        .map((line) => {
          const index = line.indexOf('=')
          return [line.slice(0, index), line.slice(index + 1)]
        }),
    )
    expect(JSON.parse(outputs.build_matrix!).include).toHaveLength(2)
    expect(JSON.parse(outputs.smoke_matrix!).include.map((entry: { commit: string }) => entry.commit)).toEqual(Object.values(commits))
    expect(JSON.parse(outputs.matrix!).include).toEqual([])
    expect(outputs.has_runtime).toBe('false')
    expect(outputs.has_smoke).toBe('true')
    expect(JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8')).samples).toBe(37)
  } finally {
    if (previous === undefined) delete process.env.GITHUB_OUTPUT
    else process.env.GITHUB_OUTPUT = previous
  }
})

test('37 attempts are checkpointed with failures retained, no retries, and process timing outside compilation', async () => {
  const harness = await temporary(),
    output = await temporary()
  await writeJson(join(harness, 'smoke-build.json'), { schemaVersion: 1, harnessCommit: commits.before, fixtureCommit: 'c'.repeat(40) })
  let attempts = 0
  const execute = jest.fn(async (_executable: string, args: string[]) => {
    const checkpoint = JSON.parse(await readFile(join(output, 'smoke-result.json'), 'utf8'))
    expect(checkpoint.samples).toHaveLength(attempts)
    attempts++
    if (attempts === 2) throw new Error('test failed')
    await writeJson(args[2]!, { tests: ['suite test'], pending: 0, failures: 0, retried: false })
    return 'passed'
  })
  jest.spyOn(console, 'log').mockImplementation(() => {})
  const measured = await runSmoke({ commit: commits.before, build: '/build/code-oss', harness, output, samples: 37 }, execute)
  expect(execute).toHaveBeenCalledTimes(37)
  expect(measured.samples).toHaveLength(37)
  expect(measured.samples.filter((s) => s.status === 'success')).toHaveLength(36)
  expect(measured.samples[1]!.error).toBe('test failed')
  expect(execute.mock.calls[0]![1]).toEqual(expect.arrayContaining(['--build', '/build', '--skip-stable-build']))
  expect(JSON.parse(await readFile(join(output, 'smoke-result.json'), 'utf8'))).toEqual(measured)
})

test('independent means and medians use successful attempts without inventing pairs', () => {
  const before = result(commits.before, [10, 20, 100]),
    after = result(commits.after, [5, 10])
  before.samples[1]!.status = 'failed'
  const compared = smokeComparison(before, after)
  expect(compared.statistics.before).toMatchObject({ count: 2, mean: 55, median: 55 })
  expect(compared.statistics.after).toMatchObject({ count: 2, mean: 7.5, median: 7.5 })
  expect(compared.summary).toContain('2/3 before')
  expect(compared.svg).toContain('mean (ms)')
  expect(compared.svg).toContain('median (ms)')
  expect(compared.svg).toContain(commits.after)
})

test('rejects mismatched fixtures, suites, pending tests, or no successful samples', () => {
  const before = result(commits.before, [10]),
    after = result(commits.after, [5])
  expect(() => compareSmoke(before, { ...after, fixtureCommit: 'd'.repeat(40) })).toThrow('fixture differs')
  after.samples[0]!.tests = ['another test']
  expect(() => compareSmoke(before, after)).toThrow('inventory differs')
  after.samples[0]!.tests = before.samples[0]!.tests
  after.samples[0]!.pending = 1
  expect(() => compareSmoke(before, after)).toThrow('inventory differs')
  after.samples[0]!.status = 'failed'
  expect(() => compareSmoke(before, after)).toThrow('No successful')
})

test('offline and Actions reports contain smoke-only statistics and SVG with missing jobs visible', async () => {
  const input = await temporary(),
    output = await temporary()
  await writeJson(join(input, 'before/smoke-result.json'), result(commits.before, [10, 20, 90]))
  await writeJson(join(input, 'after/smoke-result.json'), result(commits.after, [5, 10, 15]))
  const report = await generateReport({ input, output, commits, benchmarks: selectBenchmarks('', 'smoke') })
  expect(report.usable).toBe(true)
  expect(createWorkflowSummary(report)).toContain('| mean | 40 | 10 | -30 | -75 |')
  expect(createWorkflowSummary(report)).toContain('| median | 20 | 10 | -10 | -50 |')
  expect(await readFile(join(output, 'charts/smoke-tests.svg'), 'utf8')).toContain('median (ms)')
  expect(await readFile(join(output, 'index.html'), 'utf8')).toContain('charts/smoke-tests.svg')
  await rm(join(input, 'after'), { recursive: true })
  const missing = await reportSmoke(input, output, commits)
  expect(missing.usable).toBe(false)
  expect(missing.summary).toContain('Missing smoke results')
})

test('report rejects duplicate sample indices and nonfinite or negative durations', async () => {
  const input = await temporary(),
    output = await temporary()
  const invalid = result(commits.before, [10, 20])
  invalid.samples[1]!.index = 0
  await writeJson(join(input, 'before/smoke-result.json'), invalid)
  await writeJson(join(input, 'after/smoke-result.json'), result(commits.after, [5]))
  expect((await reportSmoke(input, output, commits)).diagnostics).toContain('Invalid smoke sample')
  invalid.samples[1]!.index = 1
  invalid.samples[0]!.elapsedMs = -1
  await writeJson(join(input, 'before/smoke-result.json'), invalid)
  expect((await reportSmoke(input, output, commits)).usable).toBe(false)
})

test('zero-test and retried attempts are retained as failures', async () => {
  const harness = await temporary(),
    output = await temporary()
  await writeJson(join(harness, 'smoke-build.json'), { schemaVersion: 1, harnessCommit: commits.before, fixtureCommit: 'c'.repeat(40) })
  let attempt = 0
  const execute = async (_executable: string, args: string[]) => {
    await writeJson(args[2]!, { tests: attempt++ === 0 ? [] : ['suite test'], pending: 0, failures: 0, retried: attempt === 2 })
    return ''
  }
  jest.spyOn(console, 'log').mockImplementation(() => {})
  const measured = await runSmoke({ commit: commits.before, build: '/build/code-oss', harness, output, samples: 2 }, execute)
  expect(measured.samples.map((s) => s.status)).toEqual(['failed', 'failed'])
})

test('duplicate commit artifacts invalidate the comparison instead of choosing one', async () => {
  const input = await temporary(),
    output = await temporary()
  await writeJson(join(input, 'before/smoke-result.json'), result(commits.before, [10]))
  await writeJson(join(input, 'duplicate/smoke-result.json'), result(commits.before, [100]))
  await writeJson(join(input, 'after/smoke-result.json'), result(commits.after, [5]))
  const report = await reportSmoke(input, output, commits)
  expect(report.usable).toBe(false)
  expect(report.diagnostics).toContain('Duplicate smoke results cannot be compared')
})
