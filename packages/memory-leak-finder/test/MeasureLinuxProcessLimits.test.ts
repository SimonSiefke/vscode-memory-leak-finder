import { expect, test } from '@jest/globals'
import { spawn, type ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as Measure from '../src/parts/MeasureLinuxProcessLimits/MeasureLinuxProcessLimits.ts'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as Measures from '../src/parts/Measures/Measures.ts'

const linuxTest = process.platform === 'linux' ? test : test.skip
const GiB = 2 ** 30
const stat = (pid: number, parentPid: number, startTime: string) =>
  `${pid} (code) S ${parentPid} ${Array(17).fill('0').join(' ')} ${startTime}`
const status = (threads: number, vmSizeKb: number, vmPeakKb = vmSizeKb) =>
  `Name:\tcode\nVmPeak:\t ${vmPeakKb} kB\nVmSize:\t ${vmSizeKb} kB\nThreads:\t${threads}\n`
const watch = (wd: number) => `inotify wd:${wd} ino:1 sdev:800001 mask:fc6 ignored_mask:0 fhandle-bytes:8 fhandle-type:1 f_handle:00\n`

interface FixtureProcess {
  readonly pid: number
  readonly parentPid: number
  readonly startTime?: string
  readonly threads?: number
  readonly vmSizeKb?: number
  // fd number -> watch count, or undefined for a regular file descriptor
  readonly fds?: Record<number, number | undefined>
  readonly unreadableFdinfo?: number
}

const createProcRoot = async (processes: readonly FixtureProcess[]) => {
  const root = await mkdtemp(join(tmpdir(), 'linux-process-limits-'))
  await mkdir(join(root, 'sys/fs/inotify'), { recursive: true })
  await mkdir(join(root, 'sys/kernel'), { recursive: true })
  await writeFile(join(root, 'sys/fs/inotify/max_user_watches'), '65536\n')
  await writeFile(join(root, 'sys/fs/inotify/max_user_instances'), '128\n')
  await writeFile(join(root, 'sys/kernel/threads-max'), '1000\n')
  for (const item of processes) {
    const dir = join(root, String(item.pid))
    await mkdir(join(dir, 'fd'), { recursive: true })
    await mkdir(join(dir, 'fdinfo'))
    await writeFile(join(dir, 'stat'), stat(item.pid, item.parentPid, item.startTime ?? '1'))
    await writeFile(join(dir, 'status'), status(item.threads ?? 1, item.vmSizeKb ?? 1024))
    for (const [fd, watches] of Object.entries(item.fds ?? {})) {
      await symlink(watches === undefined ? '/dev/null' : 'anon_inode:inotify', join(dir, 'fd', fd))
      if (Number(fd) === item.unreadableFdinfo) {
        await mkdir(join(dir, 'fdinfo', fd)) // reading a directory fails with EISDIR
      } else {
        const lines = Array.from({ length: watches ?? 0 }, (_, index) => watch(index + 1)).join('')
        await writeFile(join(dir, 'fdinfo', fd), `pos:\t0\nflags:\t02004000\nmnt_id:\t15\nino:\t1\n${lines}`)
      }
    }
  }
  return root
}

const withProcRoot = async <T>(processes: readonly FixtureProcess[], fn: (root: string) => Promise<T>) => {
  const root = await createProcRoot(processes)
  try {
    return await fn(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('public measure resolves', () => expect(GetMeasure.getMeasure({ Measures }, 'linux-process-limits')).toBe(Measure))

test('parses threads, virtual size and lifetime peak from status', () => {
  expect(Measure.parseStatus(status(23, 2048, 4096))).toEqual({ threads: 23, vmSizeBytes: 2097152, vmPeakBytes: 4194304 })
  // Zombies and kernel threads have no address space fields.
  expect(() => Measure.parseStatus('Name:\tcode\nThreads:\t1\n')).toThrow('VmSize')
})

test('counts inotify instances and watches across the tree only', async () => {
  const snapshot = await withProcRoot(
    [
      { pid: 10, parentPid: 1, threads: 30, fds: { 0: undefined, 3: 2, 4: 0 } },
      { pid: 11, parentPid: 10, threads: 5, fds: { 7: 52 } },
      { pid: 99, parentPid: 1, threads: 100, fds: { 3: 1000 } },
    ],
    (root) => Measure.capture(10, root),
  )
  expect(snapshot.errors).toEqual([])
  expect(snapshot.limits).toEqual({ maxUserWatches: 65536, maxUserInstances: 128, threadsMax: 1000 })
  expect(snapshot.processes.map((row) => [row.pid, row.inotifyInstances, row.inotifyWatches])).toEqual([
    [10, 2, 2],
    [11, 1, 52],
  ])
  expect(Measure.totals(snapshot)).toEqual({ threads: 35, inotifyInstances: 3, inotifyWatches: 54 })
})

test('unreadable fdinfo yields null inotify counts and an incomplete result', async () => {
  const processes = [
    { pid: 10, parentPid: 1, fds: { 3: 2 } },
    { pid: 11, parentPid: 10, fds: { 3: 1 }, unreadableFdinfo: 3 },
  ]
  const after = await withProcRoot(processes, (root) => Measure.capture(10, root))
  expect(after.processes.find((row) => row.pid === 11)).toMatchObject({ threads: 1, inotifyInstances: null, inotifyWatches: null })
  expect(after.errors).toEqual([{ pid: 11, message: expect.stringContaining('inotify:') }])
  const before = await withProcRoot([processes[0], { pid: 11, parentPid: 10, fds: { 3: 1 } }], (root) => Measure.capture(10, root))
  const result = Measure.compare(before, after)
  expect(result.complete).toBe(false)
  expect(result.totals.delta).toEqual({ threads: 0, inotifyInstances: null, inotifyWatches: null })
  expect(Measure.isLeak()).toBe(false)
  expect(Measure.summary(result)).toContain('inotify watches unknown')
  expect(Measure.summary(result)).toContain('INCOMPLETE')
})

test('missing system limits are reported as null', async () => {
  const root = await createProcRoot([{ pid: 10, parentPid: 1 }])
  try {
    await rm(join(root, 'sys'), { recursive: true })
    expect((await Measure.capture(10, root)).limits).toEqual({ maxUserWatches: null, maxUserInstances: null, threadsMax: null })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('PID reuse is an exit and a start; virtual size growth is reported per running process only', async () => {
  const before = await withProcRoot(
    [
      { pid: 10, parentPid: 1, vmSizeKb: 1024 },
      { pid: 11, parentPid: 10, threads: 4, fds: { 3: 2 } },
    ],
    (root) => Measure.capture(10, root),
  )
  const after = await withProcRoot(
    [
      { pid: 10, parentPid: 1, vmSizeKb: 1024 + 8 * 1024 * 1024, threads: 3 },
      { pid: 11, parentPid: 10, startTime: '2', threads: 9, vmSizeKb: 64 * 1024 * 1024, fds: { 3: 5 } },
    ],
    (root) => Measure.capture(10, root),
  )
  const result = Measure.compare(before, after)
  expect(result.rows.map((row) => [row.pid, row.startTime, row.status])).toEqual([
    [11, '2', 'started'],
    [10, '1', 'running'],
    [11, '1', 'exited'],
  ])
  expect(result.totals.delta).toEqual({ threads: 7, inotifyInstances: 0, inotifyWatches: 3 })
  expect(result.largestVmSizeDeltaBytes).toBe(8 * GiB)
  expect(result.growth).toEqual(['threads', 'inotifyWatches', 'vmSize'])
  expect(result.complete).toBe(true)
  expect(Measure.summary(result)).toContain('largest VmSize growth 8.00 GiB')
})

test('ordinary allocator-sized virtual growth is not listed as growth', async () => {
  const before = await withProcRoot([{ pid: 10, parentPid: 1, vmSizeKb: 1024 }], (root) => Measure.capture(10, root))
  const after = await withProcRoot([{ pid: 10, parentPid: 1, vmSizeKb: 1024 + 64 * 1024 }], (root) => Measure.capture(10, root))
  const result = Measure.compare(before, after)
  expect(result.largestVmSizeDeltaBytes).toBe(64 * 1024 * 1024)
  expect(result.growth).toEqual([])
})

const childScript = `
const fs = require('node:fs')
const path = require('node:path')
const { Worker } = require('node:worker_threads')
const keep = []
process.on('message', (message) => {
  if (message.type === 'grow') {
    for (let i = 0; i < 2; i++) keep.push(new WebAssembly.Memory({ initial: 1 }))
    for (let i = 0; i < 2; i++) keep.push(fs.watch(fs.mkdtempSync(path.join(message.dir, 'watch-'))))
    let online = 0
    for (let i = 0; i < 2; i++) {
      const worker = new Worker('setInterval(() => {}, 1000)', { eval: true })
      keep.push(worker)
      worker.once('online', () => ++online === 2 && process.send('done'))
    }
  } else {
    process.send('done')
  }
})
process.send('ready')
`

const runChild = async (grow: boolean) => {
  const dir = await mkdtemp(join(tmpdir(), 'linux-process-limits-child-'))
  let child: ChildProcess | undefined
  try {
    child = spawn(process.execPath, ['-e', childScript], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] })
    const message = async () => (await once(child!, 'message'))[0]
    expect(await message()).toBe('ready')
    // Let startup threads settle before the baseline snapshot.
    await new Promise((resolve) => setTimeout(resolve, 200))
    const before = await Measure.capture(child.pid!)
    child.send({ type: grow ? 'grow' : 'idle', dir })
    expect(await message()).toBe('done')
    const after = await Measure.capture(child.pid!)
    return Measure.compare(before, after)
  } finally {
    child?.kill('SIGKILL')
    await rm(dir, { recursive: true, force: true })
  }
}

linuxTest(
  'detects real thread, inotify and address-space growth of a Linux child against an idle control',
  async () => {
    const grown = await runChild(true)
    expect(grown.complete).toBe(true)
    expect(grown.totals.delta.threads).toBeGreaterThanOrEqual(2)
    expect(grown.totals.delta.inotifyInstances).toBe(1)
    expect(grown.totals.delta.inotifyWatches).toBe(2)
    expect(grown.largestVmSizeDeltaBytes).toBeGreaterThanOrEqual(8 * GiB)
    expect(grown.growth).toEqual(['threads', 'inotifyInstances', 'inotifyWatches', 'vmSize'])

    const idle = await runChild(false)
    expect(idle.complete).toBe(true)
    expect(idle.totals.delta).toEqual({ threads: 0, inotifyInstances: 0, inotifyWatches: 0 })
    expect(Math.abs(idle.largestVmSizeDeltaBytes!)).toBeLessThan(GiB)
  },
  30_000,
)
