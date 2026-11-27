import { expect, test } from '@jest/globals'
import { execFile } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { runInNewContext } from 'node:vm'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as LibuvHandleCensus from '../src/parts/LibuvHandleCensus/LibuvHandleCensus.ts'
import * as Measure from '../src/parts/MeasureLibuvHandleCensus/MeasureLibuvHandleCensus.ts'
import * as Measures from '../src/parts/Measures/Measures.ts'
import type { Session } from '../src/parts/Session/Session.ts'

const linuxTest = process.platform === 'linux' ? test : test.skip

const secret = 'hunter2-secret-token'
const cannedReport = () => ({
  header: {
    processId: 4242,
    cwd: '/home/alice/project',
    commandLine: ['/home/alice/bin/node', `--token=${secret}`],
    host: 'alice-laptop',
    networkInterfaces: [{ name: 'eth0', address: '192.168.10.23' }],
  },
  javascriptStack: { message: secret, stack: ['at /home/alice/project/index.js:1:1'] },
  nativeStack: [{ pc: '0x1', symbol: '/home/alice/lib/libsecret.so' }],
  javascriptHeap: {
    totalMemory: 1000,
    usedMemory: 500,
    nativeContextCount: 2,
    heapSpaces: { new_space: { memorySize: 1 } },
    note: '/home/alice/project',
  },
  resourceUsage: {
    rss: 900,
    free_memory: 1,
    maxRss: 4096,
    pageFaults: { IORequired: 1, IONotRequired: 2 },
    fsActivity: { reads: 3, writes: 4 },
    userCpuSeconds: 0.5,
    kernelCpuSeconds: 0.25,
  },
  libuv: [
    {
      type: 'tcp',
      is_active: true,
      is_referenced: true,
      fd: 21,
      localEndpoint: { host: 'alice-laptop', ip4: '192.168.10.23', port: 8080 },
      remoteEndpoint: { host: 'example.test', ip4: '10.0.0.9', port: 443 },
    },
    { type: 'fs_event', is_active: true, is_referenced: false, filename: '/home/alice/project' },
    { type: 'timer', is_active: true, is_referenced: true, repeat: 1000, firesInMsFromNow: 5 },
    { type: 'timer', is_active: false, is_referenced: false, repeat: 0 },
    { type: 'loop', is_active: true, loopIdleTimeSeconds: 1 },
    { type: '/home/alice/HOME=secret', is_active: true },
    { type: 'constructor', is_active: false },
  ],
  workers: [{ environmentVariables: { API_TOKEN: secret } }],
  environmentVariables: { HOME: '/home/alice', API_TOKEN: secret },
  userLimits: { core_file_size_blocks: { soft: 0 } },
  sharedObjects: ['/home/alice/lib/libsecret.so'],
})

const createRealm = (getReport: () => unknown, excludeNetwork?: boolean) => {
  const seen: unknown[] = []
  const report: Record<string, unknown> = {
    getReport() {
      seen.push(report.excludeNetwork)
      return getReport()
    },
  }
  if (excludeNetwork !== undefined) {
    report.excludeNetwork = excludeNetwork
  }
  return { realm: { process: { pid: 4242, report } }, report, seen }
}

const snapshot = (handles: Record<string, LibuvHandleCensus.HandleCounts>, pid = 1): LibuvHandleCensus.AvailableSnapshot => ({
  available: true,
  pid,
  handles,
  repeatingUvTimerCount: 0,
  resourceUsage: {
    maxRss: 100,
    pageFaults: { ioRequired: 0, ioNotRequired: 10 },
    fsActivity: { reads: 0, writes: 0 },
    userCpuSeconds: 0.1,
    kernelCpuSeconds: 0.2,
  },
  javascriptHeap: { usedMemory: 10 },
  workerCount: 0,
})

test('public measure resolves', () => {
  expect(GetMeasure.getMeasure({ Measures }, 'libuv-handle-census')).toBe(Measure)
})

test('keeps only allowlisted counters from a report containing secrets, paths and addresses', () => {
  const { realm } = createRealm(cannedReport)
  const result = LibuvHandleCensus.collect(realm)
  expect(result).toEqual({
    available: true,
    pid: 4242,
    handles: {
      constructor: { total: 1, active: 0, referenced: 0 },
      fs_event: { total: 1, active: 1, referenced: 0 },
      loop: { total: 1, active: 1, referenced: 0 },
      tcp: { total: 1, active: 1, referenced: 1 },
      timer: { total: 2, active: 1, referenced: 1 },
      unknown: { total: 1, active: 1, referenced: 0 },
    },
    repeatingUvTimerCount: 1,
    resourceUsage: {
      maxRss: 4096,
      pageFaults: { ioRequired: 1, ioNotRequired: 2 },
      fsActivity: { reads: 3, writes: 4 },
      userCpuSeconds: 0.5,
      kernelCpuSeconds: 0.25,
    },
    javascriptHeap: { totalMemory: 1000, usedMemory: 500, nativeContextCount: 2 },
    workerCount: 1,
  })
  const serialized = JSON.stringify(result)
  for (const forbidden of [secret, '/home/', 'alice', 'HOME', '192.168.10.23', '10.0.0.9', 'example.test', 'libsecret']) {
    expect(serialized).not.toContain(forbidden)
  }
})

test('excludes network lookups while reporting and restores the previous setting', () => {
  const { realm, report, seen } = createRealm(cannedReport, false)
  expect(LibuvHandleCensus.collect(realm).available).toBe(true)
  expect(seen).toEqual([true])
  expect(report.excludeNetwork).toBe(false)
})

test('restores excludeNetwork and keeps only the message when getReport throws', () => {
  const { realm, report } = createRealm(() => {
    const error = new Error('report failed')
    error.stack = `Error: report failed\n    at /home/alice/project/index.js:1:1`
    throw error
  }, false)
  expect(LibuvHandleCensus.collect(realm)).toEqual({ available: false, reason: 'report failed' })
  expect(report.excludeNetwork).toBe(false)
})

test('does not create excludeNetwork on runtimes without it', () => {
  const { realm, report } = createRealm(cannedReport, undefined)
  expect(LibuvHandleCensus.collect(realm).available).toBe(true)
  expect('excludeNetwork' in report).toBe(false)
})

test('evaluates once per snapshot and reports unavailable without process.report, as in a renderer', async () => {
  const calls: unknown[] = []
  const session = {
    async invoke(method: string, options: any) {
      calls.push([method, options.returnByValue])
      return { result: { result: { type: 'object', value: runInNewContext(options.expression, {}) } } }
    },
  } as unknown as Session
  const [created] = Measure.create(session)
  const result = await Measure.start(created)
  expect(calls).toEqual([['Runtime.evaluate', true]])
  expect(result).toEqual({ available: false, reason: 'process.report is unavailable in this target' })
  const comparison = Measure.compare(snapshot({}), result)
  expect(comparison.available).toBe(false)
  expect(Measure.isLeak()).toBe(false)
  expect(Measure.summary(comparison)).toBe('Unavailable: process.report is unavailable in this target')
})

test('refuses deltas when the inspected process changed', () => {
  const result = Measure.compare(snapshot({ pipe: { total: 1, active: 1, referenced: 1 } }, 1), snapshot({}, 2))
  expect(result).toMatchObject({ available: true, processChanged: true, suspectedTypes: [] })
  expect('handleDeltas' in result).toBe(false)
  expect(Measure.summary(result)).toContain('PID 1 to 2')
})

test('reports per-type deltas and flags types that grew by at least one per run', () => {
  const before = snapshot({ pipe: { total: 2, active: 2, referenced: 1 }, timer: { total: 1, active: 1, referenced: 1 } })
  const after = {
    ...snapshot({ pipe: { total: 4, active: 3, referenced: 1 }, tcp: { total: 1, active: 1, referenced: 1 } }),
    resourceUsage: { ...before.resourceUsage, maxRss: 150, userCpuSeconds: 0.3 },
  }
  const result = Measure.compare(before, after, { runs: 2 })
  expect(result).toMatchObject({
    available: true,
    processChanged: false,
    handleDeltas: {
      pipe: { total: 2, active: 1, referenced: 0 },
      tcp: { total: 1, active: 1, referenced: 1 },
      timer: { total: -1, active: -1, referenced: -1 },
    },
    resourceUsageDelta: { maxRss: 50, userCpuSeconds: 0.2, kernelCpuSeconds: 0 },
    javascriptHeapDelta: { usedMemory: 0 },
    suspectedTypes: ['pipe'],
  })
  expect(Measure.isLeak()).toBe(false)
  expect(Measure.summary(result)).toBe(
    'libuv handles (PID 1): pipe +2, tcp +1, timer -1; grew by at least one per run: pipe; handle growth is not proof of a leak',
  )
})

const childScript = `
import { watch } from 'node:fs'
import { Session } from 'node:inspector/promises'
import { createServer } from 'node:net'
const [expression, directory] = process.argv.slice(1)
const session = new Session()
session.connect()
const snapshot = async () => (await session.post('Runtime.evaluate', { expression, returnByValue: true })).result.value
const before = await snapshot()
const server = createServer()
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const watcher = watch(directory)
const during = await snapshot()
watcher.close()
await new Promise((resolve) => server.close(resolve))
// Closed handles leave the loop in the close phase; two check phases guarantee one has passed.
await new Promise((resolve) => setImmediate(resolve))
await new Promise((resolve) => setImmediate(resolve))
const closed = await snapshot()
session.disconnect()
process.stdout.write(JSON.stringify({ before, during, closed }))
`

linuxTest('counts real libuv handles through Runtime.evaluate in a separate Node process', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'libuv-handle-census-'))
  try {
    const { stdout } = await promisify(execFile)(
      process.execPath,
      ['--input-type=module', '-e', childScript, LibuvHandleCensus.expression, directory],
      { timeout: 30_000 },
    )
    const { before, during, closed } = JSON.parse(stdout)
    expect(before.available).toBe(true)
    const opened = Measure.compare(before, during, { runs: 1 })
    expect(opened.handleDeltas?.tcp).toEqual({ total: 1, active: 1, referenced: 1 })
    expect(opened.handleDeltas?.fs_event).toEqual({ total: 1, active: 1, referenced: 1 })
    expect(opened.suspectedTypes).toEqual(['fs_event', 'tcp'])
    const released = Measure.compare(before, closed, { runs: 1 })
    for (const [type, value] of Object.entries(released.handleDeltas ?? {})) {
      expect([type, value.total]).toEqual([type, 0])
    }
    expect(JSON.stringify(during)).not.toContain(directory)
    expect(JSON.stringify(during)).not.toContain('127.0.0.1')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
