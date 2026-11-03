import { afterEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { preflightCollectors, runBenchmark, measureSample } from '../src/parts/Runner/Runner.ts'
import { selectBenchmarks } from '../src/parts/Manifest/Manifest.ts'

const directories: string[] = []
afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
const temporary = async () => {
  const dir = await mkdtemp(join(tmpdir(), 'runner-facility-'))
  directories.push(dir)
  return dir
}

test('a job probes each requested counter family once and retains unavailable diagnostics', async () => {
  const benchmarks = [...selectBenchmarks('', 'instructions'), ...selectBenchmarks('', 'resources')]
  const probe = jest.fn(async (events: string[]) => {
    if (events.includes('instructions:u')) throw new Error('PMU not exposed')
  })
  const facilities = await preflightCollectors(benchmarks, probe)
  expect(probe).toHaveBeenCalledTimes(2)
  expect(facilities).toEqual({ hardware: { available: false, diagnostic: 'PMU not exposed' }, software: { available: true } })
  const unused = jest.fn(async (_events: string[]) => {})
  expect(await preflightCollectors(selectBenchmarks('', 'timing'), unused)).toEqual({})
  expect(unused).not.toHaveBeenCalled()
})

test('unavailable counters do not launch an application or invent zeros, and owned sample paths are cleaned', async () => {
  const output = await temporary()
  await writeFile(join(output, 'unrelated'), 'keep')
  const benchmark = { ...selectBenchmarks('open-small-instructions')[0]!, samples: 2 }
  const result = await runBenchmark({
    benchmark,
    samples: 37,
    output,
    commits: { before: 'a'.repeat(40), after: 'b'.repeat(40) },
    paths: { before: '/does-not-exist', after: '/does-not-exist' },
    facilities: { hardware: { available: false, diagnostic: 'PMU unavailable' } },
  })
  expect(result.status).toBe('unavailable')
  expect(result.requestedSamples).toBe(2)
  expect(result.samples).toHaveLength(4)
  expect(result.samples.every((sample) => sample.metrics.length === 0 && sample.diagnostics.includes('PMU unavailable'))).toBe(true)
  expect(await readFile(join(output, 'unrelated'), 'utf8')).toBe('keep')
  for (const name of await readdir(join(output, 'raw'))) {
    for (const subdir of ['profile', 'workspace', 'extensions']) await expect(stat(join(output, 'raw', name, subdir))).rejects.toThrow()
    expect(await readFile(join(output, 'raw', name, 'application.log'), 'utf8')).toContain('not launched')
  }
  expect(JSON.parse(await readFile(join(output, 'preflight.json'), 'utf8')).hardware.available).toBe(false)
})

test('a failed process spawn returns promptly with evidence and removes its isolated profile', async () => {
  const output = await temporary()
  const sample = await measureSample(
    {
      benchmark: selectBenchmarks('open-small-timing')[0]!,
      samples: 1,
      output,
      commits: { before: 'a'.repeat(40), after: 'b'.repeat(40) },
      paths: { before: '/missing-benchmark-app', after: '/missing-benchmark-app' },
    },
    0,
    'before',
    0,
  )
  expect(sample.status).toBe('failed')
  expect(sample.diagnostics.join(' ')).toContain('ENOENT')
  expect(sample.raw).toContain('raw/0-before/application.log')
  await expect(stat(join(output, 'raw/0-before/profile'))).rejects.toThrow()
}, 10_000)
