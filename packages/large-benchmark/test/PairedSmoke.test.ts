import { afterEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pairedSmokeSummary, runPairedSmoke, type PairedSmokeOptions } from '../src/parts/PairedSmoke/PairedSmoke.ts'
import type { SmokeOptions, SmokeResult } from '../src/parts/Smoke/Smoke.ts'

const directories: string[] = []
const options = async (): Promise<PairedSmokeOptions> => {
  const output = await mkdtemp(join(tmpdir(), 'paired-smoke-'))
  directories.push(output)
  return {
    commits: { before: 'a'.repeat(40), after: 'b'.repeat(40) },
    builds: { before: '/before/code-oss', after: '/after/code-oss' },
    harness: '/shared/harness',
    samples: 3,
    output,
  }
}
afterEach(async () => {
  jest.restoreAllMocks()
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
const measured = (options: SmokeOptions): SmokeResult => ({
  schemaVersion: 1,
  commit: options.commit,
  harnessCommit: 'c'.repeat(40),
  fixtureCommit: 'd'.repeat(40),
  requestedSamples: 1,
  runner: { hostname: 'same', node: process.version },
  samples: [{ index: 0, elapsedMs: options.commit.startsWith('a') ? 100 : 80, status: 'success', tests: ['suite test'], pending: 2 }],
})

test('alternates complete suite pairs using one harness and unique evidence directories', async () => {
  const config = await options()
  const calls: SmokeOptions[] = []
  const result = await runPairedSmoke(config, async (sample) => {
    calls.push(sample)
    return measured(sample)
  })
  expect(calls.map((call) => call.commit)).toEqual(['a', 'b', 'b', 'a', 'a', 'b'].map((value) => value.repeat(40)))
  expect(calls.every((call) => call.harness === config.harness && call.samples === 1)).toBe(true)
  expect(new Set(calls.map((call) => call.output)).size).toBe(6)
  expect(result.comparison).toMatchObject({ percentChange: -20, before: { count: 3 }, after: { count: 3 } })
  expect(JSON.parse(await readFile(join(config.output, 'paired-smoke-result.json'), 'utf8'))).toEqual(result)
  expect(pairedSmokeSummary(result)).toContain('3/3')
})

test('retains failed attempts without retries and excludes their entire pair', async () => {
  const config = await options()
  let count = 0
  const result = await runPairedSmoke(config, async (sample) => {
    const value = measured(sample)
    if (++count === 3) value.samples[0]!.status = 'failed'
    return value
  })
  expect(count).toBe(6)
  expect(result.pairs[1]).toMatchObject({ comparable: false, diagnostic: 'One or both attempts failed' })
  expect(result.pairs[1]!.results.after!.samples[0]!.status).toBe('failed')
  expect(result.comparison?.before.count).toBe(2)
})

test.each(['fixture', 'inventory', 'pending', 'revision', 'sample count', 'invalid timing', 'runner'] as const)(
  'does not compare a pair with mismatched %s',
  async (change) => {
    const config = await options()
    config.samples = 1
    const result = await runPairedSmoke(config, async (sample) => {
      const value = measured(sample)
      if (sample.commit === config.commits.after) {
        if (change === 'runner') value.runner.hostname = 'different-runner'
        if (change === 'fixture') value.fixtureCommit = 'e'.repeat(40)
        if (change === 'inventory') value.samples[0]!.tests = ['different suite']
        if (change === 'pending') value.samples[0]!.pending++
        if (change === 'revision') value.commit = 'f'.repeat(40)
        if (change === 'sample count') value.samples.push(value.samples[0]!)
        if (change === 'invalid timing') value.samples[0]!.elapsedMs = NaN
      }
      return value
    })
    expect(result.comparison).toBeNull()
    expect(result.pairs[0]!.comparable).toBe(false)
    expect(pairedSmokeSummary(result)).toContain('No complete matching pairs')
  },
)

test('rejects changing inventories between otherwise complete pairs', async () => {
  const config = await options()
  let count = 0
  const result = await runPairedSmoke(config, async (sample) => {
    const value = measured(sample)
    if (++count > 2) value.samples[0]!.tests = ['changed suite']
    return value
  })
  expect(result.pairs.map((pair) => pair.comparable)).toEqual([true, false, false])
  expect(result.comparison?.before.count).toBe(1)
})

test.each([0, 21, 1.5])('rejects invalid pair count %s before executing', async (samples) => {
  const config = await options()
  await expect(runPairedSmoke({ ...config, samples }, async (sample) => measured(sample))).rejects.toThrow('between 1 and 20')
})
