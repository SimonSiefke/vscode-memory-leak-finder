import { afterEach, expect, test } from '@jest/globals'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { analyzeTrace, rendererMetrics, summarizeHeap } from '../src/parts/PerformanceCapture/PerformanceCapture.ts'
import { parsePerf, PerfSession } from '../src/parts/ControlledPerfStat/ControlledPerfStat.ts'
const directories: string[] = []
const temporary = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'performance-collector-test-'))
  directories.push(directory)
  return directory
}
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

test('perf unsupported values remain absent; multiplexed counters are rejected', () => {
  expect(
    parsePerf('100,,instructions:u,20,100.00,,\n50,,cycles:u,20,100.00,,', ['instructions:u', 'cycles:u']).map((metric) => metric.value),
  ).toEqual([100, 50])
  expect(parsePerf('<not supported>,,instructions:u,0,100.00,,', ['instructions:u'])).toEqual([])
  expect(() => parsePerf('100,,instructions:u,20,50.00,,', ['instructions:u'])).toThrow('50%')
})

test('renderer durations convert seconds to milliseconds without inventing missing counters', () => {
  expect(rendererMetrics([{ name: 'ScriptDuration', value: 1 }], [{ name: 'ScriptDuration', value: 1.25 }])).toEqual([
    { name: 'scriptDuration', unit: 'ms', value: 250, coverage: 'workbench renderer' },
  ])
})

test('traces clip to measurement boundaries and exclude other renderers and post-completion work', () => {
  const marker = (message: string, ts: number) => ({ name: 'TimeStamp', ph: 'I', pid: 2, tid: 3, ts, args: { data: { message } } })
  const events = [
    marker('large-start', 10),
    { name: 'Layout', ph: 'X', pid: 2, tid: 3, ts: 20, dur: 20 },
    { name: 'Layout', ph: 'X', pid: 9, tid: 3, ts: 20, dur: 20 },
    marker('large-end', 30),
    { name: 'Layout', ph: 'X', pid: 2, tid: 3, ts: 35, dur: 20 },
  ]
  expect(analyzeTrace(events, false).find((metric) => metric.name === 'layouts')?.value).toBe(1)
  expect(analyzeTrace(events, false).find((metric) => metric.name === 'layoutDuration')?.value).toBe(0.01)
  expect(() => analyzeTrace(events, true)).toThrow('initialization')
  expect(() => analyzeTrace([], false)).toThrow('markers')
  expect(analyzeTrace([{ name: 'EvaluateScript', ph: 'X', pid: 2, tid: 3, ts: 1, dur: 2 }, ...events], true).length).toBeGreaterThan(0)
})

test('heap code bytes use the schema type index rather than assuming V8 field positions', () => {
  expect(
    summarizeHeap({
      snapshot: { meta: { node_fields: ['self_size', 'type'], node_types: ['number', ['object', 'code']] } },
      nodes: [100, 0, 50, 1],
    }).map((metric) => metric.value),
  ).toEqual([150, 50])
})

const canUsePerf =
  process.platform === 'linux' && spawnSync('perf', ['stat', '-e', 'task-clock', '--', process.execPath, '-e', '']).status === 0
const perfTest = canUsePerf ? test : test.skip

perfTest(
  'perf controls delimit real collection and leave only uploadable files after disposal',
  async () => {
    const directory = await temporary()
    const session = await PerfSession.create(directory, ['task-clock'])
    const child = spawn(process.execPath, ['-e', 'setInterval(() => { let n=0; for(let i=0;i<100000;i++) n+=i }, 1)'], { stdio: 'ignore' })
    try {
      await session.attach([child.pid!])
      await delay(100)
      await session.freeze()
      const metrics = await session.stop()
      expect(metrics[0]!.name).toBe('task-clock')
      expect(metrics[0]!.value).toBeGreaterThan(0)
    } finally {
      child.kill('SIGKILL')
      await session.dispose()
    }
    await expect(stat(join(directory, 'control'))).rejects.toThrow()
    await expect(stat(join(directory, 'ack'))).rejects.toThrow()
    expect((await readFile(join(directory, 'perf.csv'), 'utf8')).length).toBeGreaterThan(0)
  },
  15000,
)
