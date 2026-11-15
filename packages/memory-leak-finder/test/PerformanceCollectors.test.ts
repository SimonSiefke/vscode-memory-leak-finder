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

test('perf task-clock normalizes explicit milliseconds and raw nanoseconds from hosted runners', () => {
  for (const raw of [
    '3316036078,,task-clock,3316036078,100.00',
    '3316036078,nsec,task-clock,3316036078,100.00',
    '3316.036078,msec,task-clock,3316036078,100.00',
  ]) {
    expect(parsePerf(raw, ['task-clock'])[0]).toMatchObject({ value: 3316.036078, unit: 'ms' })
  }
  expect(() => parsePerf('1,unknown,task-clock,10,100.00', ['task-clock'])).toThrow('Unknown perf task-clock unit')
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

perfTest(
  'launch-inherited disabled counters include existing children while excluding setup and teardown CPU work',
  async () => {
    const directory = await temporary()
    const session = await PerfSession.create(directory, ['task-clock'])
    const busy = `const busy = (microseconds) => { const start = process.cpuUsage(); while (true) { const elapsed = process.cpuUsage(start); if (elapsed.user + elapsed.system >= microseconds) break; } }`
    const worker = `${busy}; process.stdin.once('data', () => { busy(60000); process.stdout.write('done\\n') })`
    const program = `
    const { spawn } = require('node:child_process');
    ${busy};
    const worker = spawn(process.execPath, ['-e', ${JSON.stringify(worker)}]);
    process.stdin.on('end', () => worker.kill('SIGKILL'));
    busy(400000);
    process.stdout.write('ready\\n');
    process.stdin.once('data', () => {
      worker.stdout.once('data', () => {
        process.stdout.write('done\\n');
        process.stdin.once('data', () => { busy(400000); worker.kill('SIGKILL'); process.stdin.destroy(); });
      });
      worker.stdin.write('run\\n');
    });
  `
    const child = spawn('perf', [...session.args(true), '--', process.execPath, '-e', program], {
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    session.bind(child)
    let output = ''
    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })
    const waitFor = async (text: string) => {
      const deadline = Date.now() + 10000
      while (!output.includes(text)) {
        if (Date.now() > deadline || child.exitCode !== null) throw new Error(`Child did not reach ${text}: ${output}`)
        await delay(5)
      }
    }
    try {
      await waitFor('ready')
      await session.toggle('enable')
      child.stdin.write('run\n')
      await waitFor('done')
      await session.freeze()
      child.stdin.write('quit\n')
      await new Promise<void>((resolve) => child.once('close', () => resolve()))
      const metrics = await session.stop()
      const taskClock = metrics.find((m) => m.name === 'task-clock')!.value
      // The worker contributes 60 ms of CPU. Its parent spends 800 ms outside the window.
      expect(taskClock).toBeGreaterThan(40)
      expect(taskClock).toBeLessThan(300)
    } finally {
      child.stdin.end()
      if (child.pid && child.exitCode === null) {
        try {
          process.kill(-child.pid, 'SIGKILL')
        } catch {}
      }
      await session.dispose()
    }
  },
  15000,
)
