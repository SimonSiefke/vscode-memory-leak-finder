import { expect, test } from '@jest/globals'
import { spawn, type ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { statfsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as LoadMemoryLeakFinder from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
import * as Measure from '../src/parts/MeasureLinuxProcessIo/MeasureLinuxProcessIo.ts'

const linuxTest = process.platform === 'linux' ? test : test.skip
const MiB = 1024 * 1024
const TmpfsMagic = 0x01021994

const ioText = (base: number) =>
  [
    `rchar: ${base}`,
    `wchar: ${base * 2}`,
    `syscr: ${base * 3}`,
    `syscw: ${base * 4}`,
    `read_bytes: ${base * 5}`,
    `write_bytes: ${base * 6}`,
    `cancelled_write_bytes: ${base * 7}`,
    '',
  ].join('\n')

const writeProcess = async (procRoot: string, pid: number, parentPid: number, startTime: number, io: string | null) => {
  await mkdir(join(procRoot, String(pid)), { recursive: true })
  await writeFile(
    join(procRoot, String(pid), 'stat'),
    `${pid} (proc ${pid}) S ${parentPid} ${Array(17).fill('0').join(' ')} ${startTime} 0 0`,
  )
  if (io !== null) await writeFile(join(procRoot, String(pid), 'io'), io)
}

test('public measure resolves', () => {
  const MemoryLeakFinder = LoadMemoryLeakFinder.loadMemoryLeakFinder()
  expect(GetMeasure.getMeasure(MemoryLeakFinder, 'linux-process-io')).toBe(MemoryLeakFinder.Measures.MeasureLinuxProcessIo)
  expect(GetMeasure.getMeasure(MemoryLeakFinder, 'linux-process-io').id).toBe('linuxProcessIo')
})

test('parses all seven counters and rejects a missing field', () => {
  expect(Measure.parseIo(ioText(1))).toEqual({
    rchar: 1,
    wchar: 2,
    syscr: 3,
    syscw: 4,
    readBytes: 5,
    writeBytes: 6,
    cancelledWriteBytes: 7,
  })
  expect(() => Measure.parseIo(ioText(1).replace(/^write_bytes:.*$/m, ''))).toThrow('write_bytes')
})

test('compares a fixture tree: running deltas, started lifetime values, exited and reused PIDs', async () => {
  const procRoot = await mkdtemp(join(tmpdir(), 'linux-process-io-'))
  try {
    await writeProcess(procRoot, 100, 1, 10, ioText(10))
    await writeProcess(procRoot, 101, 100, 11, ioText(1))
    await writeProcess(procRoot, 102, 101, 12, ioText(1))
    await writeProcess(procRoot, 200, 1, 13, ioText(1000))
    await writeFile(join(procRoot, 'self'), '')
    const before = await Measure.capture(100, procRoot)
    expect(before.processes.map((row) => row.pid).sort()).toEqual([100, 101, 102])

    await writeProcess(procRoot, 100, 1, 10, ioText(20))
    await rm(join(procRoot, '101'), { recursive: true })
    await writeProcess(procRoot, 102, 100, 99, ioText(3))
    await writeProcess(procRoot, 103, 100, 14, ioText(4))
    await writeProcess(procRoot, 200, 1, 13, ioText(9000))
    const after = await Measure.capture(100, procRoot)
    const result = Measure.compare(before, after)

    expect(result.available).toBe(true)
    expect(result.complete).toBe(false)
    expect(result.startedCount).toBe(2)
    expect(result.exitedCount).toBe(2)
    const byKey = Object.fromEntries(result.rows.map((row) => [`${row.pid}:${row.startTime}`, row]))
    expect(byKey['100:10']).toMatchObject({ status: 'running', delta: Measure.parseIo(ioText(10)) })
    expect(byKey['101:11']).toMatchObject({ status: 'exited', after: null, delta: null })
    expect(byKey['102:12']).toMatchObject({ status: 'exited', delta: null })
    expect(byKey['102:99']).toMatchObject({ status: 'started', before: null, delta: Measure.parseIo(ioText(3)) })
    expect(byKey['103:14']).toMatchObject({ status: 'started', delta: Measure.parseIo(ioText(4)) })
    expect(result.rows.some((row) => row.pid === 200)).toBe(false)
    // Totals cover running rows only, so the started rows do not inflate them.
    expect(result.totals).toEqual(Measure.parseIo(ioText(10)))
    expect(result.rows.map((row) => row.status)).toEqual(['running', 'started', 'started', 'exited', 'exited'])
    expect(Measure.isLeak(result)).toBe(false)
    expect(Measure.summary(result)).toContain('storage write_bytes 60, syscall wchar 20')
    expect(Measure.summary(result)).toContain('INCOMPLETE: 2 started, 2 exited')
  } finally {
    await rm(procRoot, { recursive: true, force: true })
  }
})

test('an unreadable descendant becomes a snapshot error instead of a zero', async () => {
  const procRoot = await mkdtemp(join(tmpdir(), 'linux-process-io-'))
  const canTestPermissions = typeof process.getuid === 'function' && process.getuid() !== 0
  try {
    await writeProcess(procRoot, 100, 1, 10, ioText(1))
    await writeProcess(procRoot, 101, 100, 11, null)
    await writeProcess(procRoot, 102, 100, 12, null)
    // A directory in place of the counter file fails deterministically, even when tests run as root.
    await mkdir(join(procRoot, '101', 'io'))
    if (canTestPermissions) {
      await writeProcess(procRoot, 103, 100, 13, ioText(1))
      await chmod(join(procRoot, '103', 'io'), 0o000)
    }
    const snapshot = await Measure.capture(100, procRoot)
    expect(snapshot.processes.map((row) => row.pid)).toEqual([100])
    const codes = Object.fromEntries(snapshot.errors.map((error) => [error.pid, error.code]))
    expect(codes[101]).toBe('EISDIR')
    expect(codes[102]).toBe('ENOENT')
    if (canTestPermissions) expect(codes[103]).toBe('EACCES')
    const result = Measure.compare(snapshot, snapshot)
    expect(result.complete).toBe(false)
    expect(result.errors.map((error) => error.snapshot)).toContain('after')
    expect(Measure.summary(result)).toContain('unreadable')
  } finally {
    await rm(procRoot, { recursive: true, force: true })
  }
})

test('a vanished root fails the snapshot', async () => {
  const procRoot = await mkdtemp(join(tmpdir(), 'linux-process-io-'))
  try {
    await expect(Measure.capture(100, procRoot)).rejects.toThrow('ENOENT')
  } finally {
    await rm(procRoot, { recursive: true, force: true })
  }
})

test('reports unavailable instead of throwing off Linux or without a root PID', async () => {
  const platform = Object.getOwnPropertyDescriptor(process, 'platform')!
  Object.defineProperty(process, 'platform', { ...platform, value: 'darwin' })
  let offLinux: Measure.Snapshot
  try {
    offLinux = await Measure.start(Measure.create({ pid: 123 })[0])
  } finally {
    Object.defineProperty(process, 'platform', platform)
  }
  expect(offLinux.available).toBe(false)
  const result = Measure.compare(offLinux, offLinux)
  expect(result).toMatchObject({ available: false, complete: false, totals: null, rows: [] })
  expect(Measure.isLeak(result)).toBe(false)
  expect(Measure.summary(result)).toBe('Linux process-tree I/O unavailable: linux-process-io requires Linux procfs (platform is darwin)')
  if (process.platform === 'linux') {
    expect((await Measure.start(0)).unavailableReason).toBe('linux-process-io requires the application root PID')
  }
})

const childScript = `
const fs = require('node:fs')
process.on('message', (message) => {
  if (message.type === 'pipe') {
    process.stdout.write(Buffer.alloc(message.bytes, 120), () => process.send('done'))
  } else if (message.type === 'grandchild') {
    const grandchild = "require('node:fs').writeFileSync('/dev/null', Buffer.alloc(" + message.bytes + '))'
    require('node:child_process').spawnSync(process.execPath, ['-e', grandchild])
    process.send('done')
  } else if (message.type === 'file') {
    const fd = fs.openSync(message.path, 'w')
    const chunk = Buffer.alloc(1024 * 1024, 120)
    for (let i = 0; i < message.bytes / chunk.length; i++) fs.writeSync(fd, chunk)
    fs.fsyncSync(fd)
    fs.closeSync(fd)
    process.send('done')
  }
})
process.send('ready')
`

const withChild = async (fn: (child: ChildProcess, ask: (message: object) => Promise<void>) => Promise<void>) => {
  const child = spawn(process.execPath, ['-e', childScript], { stdio: ['ignore', 'pipe', 'inherit', 'ipc'] })
  child.stdout!.resume()
  const ask = async (message: object) => {
    const reply = once(child, 'message')
    child.send(message)
    await reply
  }
  try {
    await once(child, 'message')
    await fn(child, ask)
  } finally {
    child.kill()
  }
}

const rootDelta = (before: Measure.Snapshot, after: Measure.Snapshot, pid: number) => {
  const result = Measure.compare(before, after)
  expect(result.errors).toEqual([])
  return result.rows.find((row) => row.pid === pid && row.status === 'running')!.delta!
}

linuxTest(
  'a real child writing 4 MiB to a pipe shows wchar but no storage writes',
  async () => {
    await withChild(async (child, ask) => {
      const before = await Measure.capture(child.pid!)
      await ask({ type: 'pipe', bytes: 4 * MiB })
      const delta = rootDelta(before, await Measure.capture(child.pid!), child.pid!)
      expect(delta.wchar).toBeGreaterThanOrEqual(4 * MiB)
      expect(delta.writeBytes).toBeLessThan(MiB)
    })
  },
  30_000,
)

linuxTest(
  'a real child writing 8 MiB to an fsynced file shows wchar and, off tmpfs, storage writes',
  async () => {
    const dir = await mkdtemp(join(tmpdir(), 'linux-process-io-'))
    try {
      await withChild(async (child, ask) => {
        const before = await Measure.capture(child.pid!)
        await ask({ type: 'file', bytes: 8 * MiB, path: join(dir, 'data.bin') })
        const delta = rootDelta(before, await Measure.capture(child.pid!), child.pid!)
        expect(delta.wchar).toBeGreaterThanOrEqual(8 * MiB)
        if (statfsSync(dir).type === TmpfsMagic) {
          console.info(`${dir} is tmpfs, which has no storage layer; skipped the write_bytes assertion`)
        } else {
          expect(delta.writeBytes).toBeGreaterThanOrEqual(4 * MiB)
        }
      })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  },
  30_000,
)

linuxTest(
  'a grandchild that starts and exits inside the window is attributed to the parent that reaped it',
  async () => {
    await withChild(async (child, ask) => {
      const before = await Measure.capture(child.pid!)
      await ask({ type: 'grandchild', bytes: 2 * MiB })
      const after = await Measure.capture(child.pid!)
      expect(after.processes.map((row) => row.pid)).toEqual([child.pid])
      expect(rootDelta(before, after, child.pid!).wchar).toBeGreaterThanOrEqual(2 * MiB)
    })
  },
  30_000,
)

linuxTest(
  'an idle real child stays near zero',
  async () => {
    await withChild(async (child) => {
      const before = await Measure.capture(child.pid!)
      await sleep(300)
      const delta = rootDelta(before, await Measure.capture(child.pid!), child.pid!)
      expect(delta.wchar).toBeLessThan(64 * 1024)
      expect(delta.writeBytes).toBeLessThan(64 * 1024)
    })
  },
  30_000,
)
