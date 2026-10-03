import { expect, test } from '@jest/globals'
import * as MeasureWindowsHandles from '../src/parts/MeasureWindowsHandles/MeasureWindowsHandles.ts'

const makeProcess = (
  pid: number,
  parentPid: number,
  handleCount: number,
  name = `process-${pid}.exe`,
): MeasureWindowsHandles.WindowsHandleProcess => ({
  handleCount,
  name,
  parentPid,
  pid,
})

const makeSnapshot = (processes: readonly MeasureWindowsHandles.WindowsHandleProcess[]): MeasureWindowsHandles.WindowsHandlesSnapshot => ({
  capturedAt: '2026-09-23T00:00:00.000Z',
  processes,
  rootPid: 100,
})

test('parseProcessList parses a single process and an array', () => {
  expect(MeasureWindowsHandles.parseProcessList({ handleCount: 12, name: 'Code.exe', parentPid: 1, pid: 100 })).toEqual([
    { handleCount: 12, name: 'Code.exe', parentPid: 1, pid: 100 },
  ])
  expect(MeasureWindowsHandles.parseProcessList([{ handleCount: 4, name: 'node.exe', parentPid: 100, pid: 101 }])).toEqual([
    { handleCount: 4, name: 'node.exe', parentPid: 100, pid: 101 },
  ])
})

test('filterProcessTree keeps the root and descendants only', () => {
  const processes = [makeProcess(100, 1, 10), makeProcess(101, 100, 20), makeProcess(102, 101, 30), makeProcess(200, 1, 99)]
  expect(MeasureWindowsHandles.filterProcessTree(processes, 100).map((item) => item.pid)).toEqual([100, 101, 102])
})

test('compareSnapshots reports handle growth by process', () => {
  const before = makeSnapshot([makeProcess(100, 1, 10, 'Code.exe'), makeProcess(101, 100, 20, 'node.exe')])
  const after = makeSnapshot([
    makeProcess(100, 1, 11, 'Code.exe'),
    makeProcess(101, 100, 35, 'node.exe'),
    makeProcess(102, 101, 7, 'utility.exe'),
  ])
  const result = MeasureWindowsHandles.compareSnapshots(before, after)
  expect(result).toMatchObject({ afterHandles: 53, beforeHandles: 30, deltaHandles: 23, isLeak: true, rootPid: 100, threshold: 0 })
  expect(result.topGrowth[0]).toMatchObject({ deltaHandles: 15, name: 'node.exe', pid: 101 })
  expect(result.topGrowth[1]).toMatchObject({ deltaHandles: 7, name: 'utility.exe', pid: 102 })
})
