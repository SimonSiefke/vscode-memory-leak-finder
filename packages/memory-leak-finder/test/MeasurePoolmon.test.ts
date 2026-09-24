import { expect, jest, test } from '@jest/globals'
import * as MeasurePoolmon from '../src/parts/MeasurePoolmon/MeasurePoolmon.ts'

const createSnapshot = (raw: string, processes: readonly MeasurePoolmon.ProcessMemoryRow[] = []): MeasurePoolmon.PoolmonSnapshot => ({
  capturedAt: '2026-09-23T00:00:00.000Z',
  poolmonPath: 'poolmon.exe',
  pooltagPath: 'pooltag.txt',
  processError: '',
  processes,
  raw,
  rows: MeasurePoolmon.parsePoolmonRows(raw),
})

test('parsePoolmonRows parses pool tags and mapped drivers', () => {
  const rows = MeasurePoolmon.parsePoolmonRows(`
 Tag  Type     Allocs            Frees               Diff            Bytes                 Per Alloc       Mapped_Driver
 ConT Nonp                3097               2409               688       42770432            62166        Unknown Driver
 Thre Nonp              180351             176602              3749       13179648              3515        [nt!ps - Thread objects]
`)

  expect(rows).toEqual([
    {
      allocs: 3097,
      bytes: 42770432,
      bytesPerAlloc: 62166,
      diff: 688,
      frees: 2409,
      mappedDriver: 'Unknown Driver',
      tag: 'ConT',
      type: 'Nonp',
    },
    {
      allocs: 180351,
      bytes: 13179648,
      bytesPerAlloc: 3515,
      diff: 3749,
      frees: 176602,
      mappedDriver: '[nt!ps - Thread objects]',
      tag: 'Thre',
      type: 'Nonp',
    },
  ])
})

test('parseTasklist parses process memory rows', () => {
  expect(MeasurePoolmon.parseTasklist('"Code.exe","1234","Console","1","1,024 K"\r\n"other.exe","42","Services","0","512 K"')).toEqual([
    { imageName: 'Code.exe', memoryKb: 1024, pid: 1234 },
    { imageName: 'other.exe', memoryKb: 512, pid: 42 },
  ])
})

test('compareSnapshots reports growing pool tags and process memory', () => {
  const before = createSnapshot(' Leak Nonp 10 8 2 65536 32768 [driver.sys - test]', [{ imageName: 'Code.exe', memoryKb: 1000, pid: 1234 }])
  const after = createSnapshot(' Leak Nonp 12 8 4 196608 49152 [driver.sys - test]', [{ imageName: 'Code.exe', memoryKb: 1400, pid: 1234 }])

  const result = MeasurePoolmon.compareSnapshots(before, after)

  expect(result.isLeak).toBe(true)
  expect(result.pool.deltaBytes).toBe(131072)
  expect(result.topGrowth[0]).toMatchObject({ deltaBytes: 131072, tag: 'Leak' })
  expect(result.processMemoryGrowth[0]).toEqual({
    afterPrivateMemoryKb: null,
    beforePrivateMemoryKb: null,
    deltaPrivateMemoryKb: null,
    status: 'running',
    afterMemoryKb: 1400,
    beforeMemoryKb: 1000,
    deltaMemoryKb: 400,
    imageName: 'Code.exe',
    pid: 1234,
  })
})

const processIdentity = {
  imageName: 'Code.exe',
  pid: 1234,
  parentPid: 100,
  createdAt: '2026-09-24T12:00:00.0000000Z',
  commandLine: '"C:\\Code\\Code.exe" --type=renderer',
  executablePath: 'C:\\Code\\Code.exe',
  memoryKb: 1024,
  privateMemoryKb: 512,
}

test('parseProcessList preserves identities, Unicode and unavailable metadata', () => {
  const restricted = { ...processIdentity, pid: 42, createdAt: null, commandLine: null, executablePath: null, privateMemoryKb: null }
  const unicode = { ...processIdentity, commandLine: 'Code.exe --folder=日本語' }
  expect(MeasurePoolmon.parseProcessList(JSON.stringify([unicode, restricted]))).toEqual([unicode, restricted])
  expect(MeasurePoolmon.parseProcessList('\uFEFF' + JSON.stringify(processIdentity))).toEqual([processIdentity])
  expect(MeasurePoolmon.parseProcessList('[]')).toEqual([])
  expect(() => MeasurePoolmon.parseProcessList(JSON.stringify([{ ...processIdentity, memoryKb: null }]))).toThrow('Invalid process')
  expect(() => MeasurePoolmon.parseProcessList('not json')).toThrow()
})

test('compareSnapshots treats a reused PID as an exit and a new process', () => {
  const before = createSnapshot('', [processIdentity])
  const replacement = { ...processIdentity, createdAt: '2026-09-24T12:01:00.0000000Z', memoryKb: 2048 }
  const result = MeasurePoolmon.compareSnapshots(before, createSnapshot('', [replacement]))
  expect(result.processMemoryRows).toEqual([
    expect.objectContaining({ createdAt: replacement.createdAt, beforeMemoryKb: 0, afterMemoryKb: 2048, status: 'started' }),
    expect.objectContaining({ createdAt: processIdentity.createdAt, beforeMemoryKb: 1024, afterMemoryKb: 0, status: 'exited' }),
  ])
})

test('compareSnapshots preserves unchanged working sets, private growth, and more than 100 processes', () => {
  const processes = Array.from({ length: 125 }, (_, pid) => ({ ...processIdentity, pid }))
  const before = createSnapshot('', processes)
  const after = createSnapshot(
    '',
    processes.map((row) => ({ ...row, privateMemoryKb: 768 })),
  )
  const result = MeasurePoolmon.compareSnapshots(before, after)
  expect(result.processMemoryRows).toHaveLength(125)
  expect(result.processMemoryRows[0]).toMatchObject({ deltaMemoryKb: 0, deltaPrivateMemoryKb: 256, status: 'running' })
  expect(result.snapshots.before.processes).toHaveLength(125)
  expect(result.snapshots.after.processes).toHaveLength(125)
})

test('failed queries are reported without fabricating process starts or exits', () => {
  const healthy = createSnapshot('', [processIdentity])
  const failed = { ...createSnapshot(''), processError: 'CIM query timed out' }
  for (const [before, after] of [
    [healthy, failed],
    [failed, healthy],
  ]) {
    const result = MeasurePoolmon.compareSnapshots(before, after)
    expect(result.processMemoryRows).toEqual([])
    expect(result.processSnapshotErrors).toEqual(['CIM query timed out'])
  }
})

test('idle comparisons retain the immediate result and show recovery against the baseline', () => {
  const before = createSnapshot('', [processIdentity])
  const after = createSnapshot('', [{ ...processIdentity, memoryKb: 2048 }])
  const result = MeasurePoolmon.compareSnapshots(before, {
    ...after,
    idleSnapshots: [{ idleSeconds: 5, elapsedMs: 5100, snapshot: before }],
  })
  expect(result.processMemoryGrowth[0].deltaMemoryKb).toBe(1024)
  expect(result.idleSnapshots[0].comparison.processMemoryGrowth).toEqual([])
  expect(result.idleSnapshots[0].snapshot.processes).toEqual(before.processes)
})

test('idle snapshot offsets are not cumulative and include actual collection time', async () => {
  jest.useFakeTimers()
  try {
    const times: number[] = []
    const capture = async () => {
      times.push(performance.now())
      await new Promise<void>((resolve) => setTimeout(resolve, 1000))
      return createSnapshot('')
    }
    const pending = MeasurePoolmon.captureAfterSnapshots(capture, [5, 30, 60])
    await jest.advanceTimersByTimeAsync(62_000)
    const result = await pending
    expect(times).toEqual([0, 6000, 31000, 61000])
    expect(result.idleSnapshots?.map((row) => row.elapsedMs)).toEqual([6000, 31000, 61000])
  } finally {
    jest.useRealTimers()
  }
})

test('idle snapshot scheduling can be disabled', async () => {
  const capture = jest.fn(async () => createSnapshot(''))
  const result = await MeasurePoolmon.captureAfterSnapshots(capture, [])
  expect(capture).toHaveBeenCalledTimes(1)
  expect(result.idleSnapshots).toEqual([])
})

test('idle delay configuration rejects invalid or unordered offsets', () => {
  expect(MeasurePoolmon.parseIdleSeconds('5,30,60')).toEqual([5, 30, 60])
  expect(MeasurePoolmon.parseIdleSeconds('0')).toEqual([])
  for (const value of ['', '5,', '-1', '30,5', '5,5', '61', 'NaN', 'Infinity']) {
    expect(() => MeasurePoolmon.parseIdleSeconds(value)).toThrow('POOLMON_IDLE_SECONDS')
  }
})

test('parseProcessList preserves resource counters and rejects invalid counts', () => {
  const row = { ...processIdentity, handleCount: 123, threadCount: 7 }
  expect(MeasurePoolmon.parseProcessList(JSON.stringify([row]))).toEqual([row])
  const unavailable = { ...processIdentity, handleCount: null, threadCount: null }
  expect(MeasurePoolmon.parseProcessList(JSON.stringify([unavailable]))).toEqual([unavailable])
  for (const field of ['handleCount', 'threadCount']) {
    for (const value of [-1, 1.5, '10']) {
      expect(() => MeasurePoolmon.parseProcessList(JSON.stringify([{ ...row, [field]: value }]))).toThrow(`Invalid process ${field}`)
    }
  }
})
