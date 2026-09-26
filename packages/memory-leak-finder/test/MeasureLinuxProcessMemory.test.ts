import { expect, test } from '@jest/globals'
import * as Measure from '../src/parts/MeasureLinuxProcessMemory/MeasureLinuxProcessMemory.ts'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as Measures from '../src/parts/Measures/Measures.ts'

const row = (pid: number, parentPid = 0, startTime = '1', pssBytes = 100): Measure.MemoryRow => ({
  pid,
  parentPid,
  startTime,
  pssBytes,
  name: 'code',
  rssBytes: 200,
  privateBytes: 50,
  swapPssBytes: 0,
})
const snapshot = (processes: Measure.MemoryRow[], errors: { pid: number; message: string }[] = []): Measure.Snapshot => ({
  rootPid: 1,
  capturedAt: '',
  processes,
  errors,
})
test('public measure resolves', () => expect(GetMeasure.getMeasure({ Measures }, 'linux-process-memory')).toBe(Measure))
test('parses comm containing spaces and closing parentheses', () => {
  expect(Measure.parseStat(1, `1 (a ) b) S 0 ${Array(17).fill('0').join(' ')} 1234`)).toMatchObject({
    name: 'a ) b',
    startTime: '1234',
    parentPid: 0,
  })
})
test('parses PSS, private huge pages and swap without summing RSS', () => {
  expect(
    Measure.parseSmaps('Rss: 100 kB\nPss: 60 kB\nPrivate_Clean: 10 kB\nPrivate_Dirty: 20 kB\nPrivate_Hugetlb: 2 kB\nSwapPss: 4 kB'),
  ).toEqual({ rssBytes: 102400, pssBytes: 61440, privateBytes: 32768, swapPssBytes: 4096 })
  expect(() => Measure.parseSmaps('Rss: 0 kB')).toThrow('Pss')
})
test('selects descendants regardless of enumeration order and excludes unrelated processes', () => {
  expect(Measure.selectTree([row(3, 2), row(9), row(2, 1), row(1)], 1).map((row) => row.pid)).toEqual([3, 2, 1])
})
test('PID reuse becomes an exit and start rather than a running-process delta', () => {
  const result = Measure.compare(snapshot([row(1)]), snapshot([row(1, 0, '2', 100000)]))
  expect(result.rows.map((row) => row.status)).toEqual(['started', 'exited'])
  expect(Measure.isLeak(result)).toBe(true)
})
test('partial snapshots suppress automatic leak classification and retain errors', () => {
  const result = Measure.compare(snapshot([row(1)]), snapshot([row(1, 0, '1', 100000)], [{ pid: 2, message: 'EACCES' }]))
  expect(result.complete).toBe(false)
  expect(Measure.isLeak(result)).toBe(false)
  expect(Measure.summary(result)).toContain('INCOMPLETE')
})
test('captures a real Linux process', async () => {
  if (process.platform !== 'linux') return
  const result = await Measure.capture(process.pid)
  expect(result.processes.find((row) => row.pid === process.pid)?.pssBytes).toBeGreaterThan(0)
})
