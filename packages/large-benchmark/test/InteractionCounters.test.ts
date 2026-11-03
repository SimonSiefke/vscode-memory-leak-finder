import { afterEach, expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as childProcess from 'node:child_process'

const events: string[] = []
let child: any
const spawn = jest.fn<typeof childProcess.spawn>(() => {
  events.push('spawn')
  child = Object.assign(new EventEmitter(), {
    pid: 1_000_000_000,
    exitCode: null,
    signalCode: null,
    stdout: new PassThrough(),
    stderr: new PassThrough(),
  })
  queueMicrotask(() => child.emit('spawn'))
  return child
})
jest.unstable_mockModule('node:child_process', () => ({ ...childProcess, spawn }))
const attach = jest.fn(async () => {
  throw new Error('Problems finding threads of monitor')
})
const perf = {
  args: jest.fn((disabled?: boolean) => ['stat', ...(disabled ? ['--delay=-1'] : [])]),
  bind: jest.fn(() => {}),
  attach,
  toggle: jest.fn(async () => {
    events.push('enable')
  }),
  freeze: jest.fn(async () => {
    events.push('disable')
  }),
  stop: jest.fn(async () => {
    events.push('stop')
    return [{ name: 'instructions', value: 100, unit: 'count', coverage: 'Electron process tree' }]
  }),
  dispose: jest.fn(async () => {}),
}
const resourceRoots: boolean[] = []
const session = { invoke: async () => ({}), dispose: async () => {} }
jest.unstable_mockModule('../src/parts/Shared/Shared.ts', () => ({
  connectTarget: async () => session,
  waitReady: async () => {},
  evaluate: async (_session: unknown, expression: string) => {
    if (expression.includes('electron.app.quit()')) {
      events.push('quit')
      child.exitCode = 0
      child.emit('close', 0)
    }
  },
  electronExpression: (value: string) => value,
  prepareFixture: async (directory: string) => mkdir(directory, { recursive: true }),
  createScenario: async () => ({
    setup: async () => {
      events.push('setup')
    },
    run: async () => {
      events.push('run')
    },
    dispose: async () => {
      events.push('teardown')
      if (child.exitCode !== null) throw new Error('Scenario teardown ran after the application exited')
    },
  }),
  processTree: async () => [],
  hardwareEvents: ['instructions:u'],
  softwareEvents: ['task-clock'],
  probePerf: async () => {},
  PerfSession: { create: async () => perf },
  ResourceSampler: class {
    samples = []
    diagnostics = []
    constructor(_pid: number, excludeRoot: boolean) {
      resourceRoots.push(excludeRoot)
    }
    async start() {}
    async stop() {
      return []
    }
  },
  heapSnapshot: async () => [],
  profileMetrics: () => [],
  rendererMetrics: () => [],
  stopTrace: () => [],
  traceCategories: '',
  MeasureCpuProfile: {},
  MeasureBrowserPerformanceCounters: {},
  getCssSelectorStats: () => [],
  stopRecording: async () => [],
  traceWindow: () => [],
}))
const { measureSample } = await import('../src/parts/Runner/Runner.ts')
const directories: string[] = []
afterEach(async () => {
  jest.clearAllMocks()
  events.length = 0
  resourceRoots.length = 0
  await Promise.all(directories.splice(0).map((p) => rm(p, { recursive: true, force: true })))
})

test.each(['instructions', 'resources'] as const)(
  'interaction %s collection inherits from launch and measures only run, without attaching to exiting PIDs',
  async (collector) => {
    const directory = await mkdtemp(join(tmpdir(), 'interaction-counters-'))
    directories.push(directory)
    await mkdir(join(directory, 'resources/app'), { recursive: true })
    await writeFile(join(directory, 'resources/app/package.json'), JSON.stringify({ version: '1.145.0' }))
    const sample = await measureSample(
      {
        benchmark: { id: `open-small-${collector}`, scenario: 'open-small', collector, startup: false, cache: 'action', diagnostic: false },
        samples: 1,
        output: join(directory, 'output'),
        commits: { before: 'a'.repeat(40), after: 'b'.repeat(40) },
        paths: { before: join(directory, 'code-oss'), after: join(directory, 'code-oss') },
        facilities: { hardware: { available: true }, software: { available: true } },
      },
      0,
      'before',
      0,
    )
    expect(sample.diagnostics).toEqual([])
    expect(sample.status).toBe('success')
    expect(attach).not.toHaveBeenCalled()
    expect(spawn.mock.calls[0]![0]).toBe('perf')
    expect(spawn.mock.calls[0]![1]).toContain('--delay=-1')
    expect(events.indexOf('enable')).toBeGreaterThan(events.indexOf('setup'))
    expect(events.indexOf('enable')).toBeLessThan(events.indexOf('run'))
    expect(events.indexOf('disable')).toBeGreaterThan(events.indexOf('run'))
    expect(events.indexOf('disable')).toBeLessThan(events.indexOf('quit'))
    expect(events.indexOf('stop')).toBeGreaterThan(events.indexOf('quit'))
    expect(events.indexOf('teardown')).toBeGreaterThan(events.indexOf('disable'))
    expect(events.indexOf('teardown')).toBeLessThan(events.indexOf('quit'))
    if (collector === 'resources') expect(resourceRoots).toEqual([true])
  },
)

test('a perf supervisor exiting early cannot leave its sample-owned process group behind', async () => {
  const kill = jest.spyOn(process, 'kill').mockImplementation(() => true)
  const directory = await mkdtemp(join(tmpdir(), 'interaction-exit-'))
  directories.push(directory)
  await mkdir(join(directory, 'resources/app'), { recursive: true })
  await writeFile(join(directory, 'resources/app/package.json'), JSON.stringify({ version: '1.145.0' }))
  perf.toggle.mockImplementationOnce(async () => {
    child.exitCode = 1
    throw new Error('perf exited')
  })
  try {
    await measureSample(
      {
        benchmark: {
          id: 'open-small-resources',
          scenario: 'open-small',
          collector: 'resources',
          startup: false,
          cache: 'action',
          diagnostic: false,
        },
        samples: 1,
        output: join(directory, 'output'),
        commits: { before: 'a'.repeat(40), after: 'b'.repeat(40) },
        paths: { before: join(directory, 'code-oss'), after: join(directory, 'code-oss') },
        facilities: { software: { available: true } },
      },
      0,
      'before',
      0,
    )
    expect(kill).toHaveBeenCalledWith(-1_000_000_000, 'SIGKILL')
  } finally {
    kill.mockRestore()
  }
})
