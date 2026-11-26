import { expect, test } from '@jest/globals'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as Measure from '../src/parts/MeasurePeakMemoryHighWater/MeasurePeakMemoryHighWater.ts'
import * as Measures from '../src/parts/Measures/Measures.ts'

const linuxTest = process.platform === 'linux' ? test : test.skip
const ownerTest = process.getuid?.() === 0 ? test.skip : test
const MiB = 1024 * 1024
const stat = (pid: number, parentPid: number, startTime: string) =>
  `${pid} (code) S ${parentPid} ${Array(17).fill('0').join(' ')} ${startTime}`
const status = (hwmKb: number, rssKb: number) => `Name:\tcode\nVmHWM:\t${hwmKb} kB\nVmRSS:\t${rssKb} kB\n`
const writeProcess = async (root: string, pid: number, parentPid: number, startTime: string, hwmKb: number, rssKb: number) => {
  await mkdir(join(root, String(pid)), { recursive: true })
  await writeFile(join(root, String(pid), 'stat'), stat(pid, parentPid, startTime))
  await writeFile(join(root, String(pid), 'status'), status(hwmKb, rssKb))
  await writeFile(join(root, String(pid), 'clear_refs'), '')
}
const state = (pid: number, procRoot: string, cgroupOps = Measure.realCgroupOps, cgroupPath: string | null = null): Measure.State => ({
  pid,
  procRoot,
  cgroupOps,
  cgroupPath,
  peakFile: null,
  cgroup: null,
})
const withProcRoot = async (fn: (root: string) => Promise<void>) => {
  const root = await mkdtemp(join(tmpdir(), 'peak-memory-proc-'))
  try {
    await fn(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('public measure resolves', () => expect(GetMeasure.getMeasure({ Measures }, 'peak-memory-high-water')).toBe(Measure))

test('parses VmHWM and VmRSS and rejects status without them', () => {
  expect(Measure.parseStatus(status(4, 2))).toEqual({ peakRssBytes: 4096, rssBytes: 2048 })
  expect(() => Measure.parseStatus('Name:\tkthreadd\n')).toThrow('VmHWM')
})

ownerTest('resets the tree, reports windows per process and never sums peaks', () =>
  withProcRoot(async (root) => {
    await writeProcess(root, 1, 0, '10', 900, 100)
    await writeProcess(root, 2, 1, '20', 800, 200)
    await writeProcess(root, 3, 2, '30', 700, 300)
    await writeProcess(root, 9, 0, '90', 999999, 1)
    await chmod(join(root, '3', 'clear_refs'), 0o444)
    const measureState = state(1, root)
    const before = await Measure.start(measureState)
    expect(await readFile(join(root, '1', 'clear_refs'), 'utf8')).toBe('5')
    expect(before.processes.map((row) => [row.pid, row.resettable])).toEqual([
      [1, true],
      [2, true],
      [3, false],
    ])
    // PID 2 is reused by a new process and PID 4 starts during the window.
    await writeProcess(root, 1, 0, '10', 5000, 150)
    await writeProcess(root, 2, 1, '25', 600, 600)
    await writeProcess(root, 4, 1, '40', 400, 100)
    const result = Measure.compare(before, await Measure.stop(measureState))
    const rows = Object.fromEntries(result.rows.map((row) => [`${row.pid}:${row.startTime}`, row]))
    expect(rows['1:10']).toMatchObject({ status: 'running', window: 'since-reset', peakRssBytes: 5000 * 1024, rssAtResetBytes: 102400 })
    expect(rows['1:10'].rssAtStopBytes).toBe(150 * 1024)
    expect(rows['2:20']).toMatchObject({ status: 'exited', window: null, peakRssBytes: null, rssAtStopBytes: null })
    expect(rows['2:25']).toMatchObject({ status: 'started', window: 'process-lifetime', peakRssBytes: 600 * 1024, rssAtResetBytes: null })
    expect(rows['3:30']).toMatchObject({ status: 'running', window: 'lifetime-unreset', resettable: false })
    expect(rows['4:40']).toMatchObject({ status: 'started', window: 'process-lifetime' })
    expect(rows['9:90']).toBeUndefined()
    expect(result.largestProcessPeakRssBytes).toBe(5000 * 1024)
    expect(result.complete).toBe(false)
    expect(result.cgroup).toBeNull()
    expect(Object.keys(result).sort()).toEqual([
      'cgroup',
      'complete',
      'largestProcessPeakName',
      'largestProcessPeakPid',
      'largestProcessPeakRssBytes',
      'rows',
      'snapshots',
    ])
    expect(Measure.isLeak()).toBe(false)
    expect(Measure.summary(result)).toContain('INCOMPLETE')
  }),
)

test('a missing root process fails the snapshot', () =>
  withProcRoot(async (root) => {
    await expect(Measure.start(state(1, root))).rejects.toThrow()
  }))

interface FakeCgroup {
  current: number
  lifetime: number
  writable: boolean
  missing: boolean
  readonly members: string
  readonly open: Set<{ own: number | null }>
  opened: number
}
const fakeCgroup = (overrides: Partial<FakeCgroup> = {}): FakeCgroup => ({
  current: 100,
  lifetime: 500,
  writable: true,
  missing: false,
  members: '1\n',
  open: new Set(),
  opened: 0,
  ...overrides,
})
const charge = (cgroup: FakeCgroup, bytes: number) => {
  cgroup.current = bytes
  cgroup.lifetime = Math.max(cgroup.lifetime, bytes)
  for (const fd of cgroup.open) if (fd.own !== null) fd.own = Math.max(fd.own, bytes)
}
const fakeOps = (cgroup: FakeCgroup): Measure.CgroupOps => ({
  realpath: async (path) => path,
  async readFile(path) {
    if (path.endsWith('cgroup.procs')) return cgroup.members
    if (path.endsWith('memory.current')) return `${cgroup.current}\n`
    if (path.endsWith('memory.peak')) return `${cgroup.lifetime}\n`
    throw new Error(`unexpected ${path}`)
  },
  async openPeak(_path, writable) {
    if (cgroup.missing) throw Object.assign(new Error('missing'), { code: 'ENOENT' })
    if (writable && !cgroup.writable) throw Object.assign(new Error('read-only'), { code: 'EACCES' })
    const fd = { own: null as number | null }
    cgroup.open.add(fd)
    cgroup.opened++
    return {
      read: async () => `${fd.own ?? cgroup.lifetime}\n`,
      async reset() {
        fd.own = cgroup.current
      },
      async close() {
        cgroup.open.delete(fd)
      },
    }
  },
})
const runCgroup = async (cgroup: FakeCgroup, during: () => void) => {
  const root = await mkdtemp(join(tmpdir(), 'peak-memory-cgroup-'))
  try {
    await writeProcess(root, 1, 0, '10', 10, 10)
    const measureState = state(1, root, fakeOps(cgroup), '/sys/fs/cgroup/test')
    const before = await Measure.start(measureState)
    during()
    try {
      return Measure.compare(before, await Measure.stop(measureState))
    } finally {
      await Measure.releaseResources(measureState)
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('cgroup mode resets one held descriptor and reads the window peak through it', async () => {
  const cgroup = fakeCgroup()
  const result = await runCgroup(cgroup, () => {
    expect(cgroup.open.size).toBe(1)
    charge(cgroup, 300)
    charge(cgroup, 120)
  })
  expect(result.cgroup).toMatchObject({
    available: true,
    resettable: true,
    consistent: true,
    lifetimePeakChargedBytesAtStart: 500,
    currentBytesAtStart: 100,
    peakChargedBytesSinceReset: 300,
    currentBytesAtStop: 120,
    lifetimePeakChargedBytes: 500,
  })
  expect(cgroup.opened).toBe(1)
  expect(cgroup.open.size).toBe(0)
  expect(Measure.summary(result)).toContain('cgroup charged peak since reset')
})

test('cgroup mode flags a peak below current usage as inconsistent', async () => {
  const cgroup = fakeCgroup()
  const result = await runCgroup(cgroup, () => {
    // Another descriptor's reset can lower this descriptor's watermark on some kernels.
    for (const fd of cgroup.open) fd.own = 50
    cgroup.current = 120
  })
  expect(result.cgroup?.consistent).toBe(false)
})

test('a read-only memory.peak reports only the lifetime peak', async () => {
  const cgroup = fakeCgroup({ writable: false })
  const result = await runCgroup(cgroup, () => charge(cgroup, 700))
  expect(result.cgroup).toMatchObject({
    available: true,
    resettable: false,
    peakChargedBytesSinceReset: null,
    lifetimePeakChargedBytes: 700,
    consistent: null,
  })
  expect(cgroup.open.size).toBe(0)
})

test('a missing memory.peak keeps the per-process result', async () => {
  const result = await runCgroup(fakeCgroup({ missing: true }), () => undefined)
  expect(result.cgroup).toMatchObject({ available: false, error: 'memory.peak is unavailable', peakChargedBytesSinceReset: null })
  expect(result.rows).toHaveLength(1)
})

test('cgroup mode rejects an application outside the configured cgroup', async () => {
  await expect(runCgroup(fakeCgroup({ members: '2\n' }), () => undefined)).rejects.toThrow('not in LINUX_CGROUP_PATH')
})

const child = `
let base = process.memoryUsage.rss()
process.stdin.setEncoding('utf8')
process.stdin.on('data', async (line) => {
  if (line.includes('spike')) {
    let buffer = Buffer.allocUnsafe(256 * 1024 * 1024).fill(1)
    buffer = null
    globalThis.gc()
    for (let i = 0; i < 100 && process.memoryUsage.rss() > base + 64 * 1024 * 1024; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      globalThis.gc()
    }
  }
  process.stdout.write('done\\n')
})
process.stdout.write('ready\\n')
`
const measureChild = async (command: string) => {
  const subprocess = spawn(process.execPath, ['--expose-gc', '-e', child], { stdio: ['pipe', 'pipe', 'inherit'] })
  try {
    subprocess.stdout.setEncoding('utf8')
    await once(subprocess.stdout, 'data')
    const measureState = state(subprocess.pid!, '/proc')
    const before = await Measure.start(measureState)
    subprocess.stdin.write(`${command}\n`)
    await once(subprocess.stdout, 'data')
    const result = Measure.compare(before, await Measure.stop(measureState))
    return result.rows.find((row) => row.pid === subprocess.pid)!
  } finally {
    subprocess.kill()
  }
}

linuxTest(
  'captures a freed 256 MiB spike that before/after RSS misses',
  async () => {
    const spike = await measureChild('spike')
    expect(spike.window).toBe('since-reset')
    expect(spike.peakRssBytes! - spike.rssAtStopBytes!).toBeGreaterThanOrEqual(150 * MiB)
    const control = await measureChild('noop')
    expect(control.window).toBe('since-reset')
    expect(control.peakRssBytes! - control.rssAtStopBytes!).toBeLessThan(32 * MiB)
  },
  30_000,
)
