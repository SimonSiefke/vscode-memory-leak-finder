import { expect, test } from '@jest/globals'
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
    afterMemoryKb: 1400,
    beforeMemoryKb: 1000,
    deltaMemoryKb: 400,
    imageName: 'Code.exe',
    pid: 1234,
  })
})
