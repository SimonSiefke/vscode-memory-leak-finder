import { test, expect } from '@jest/globals'
import * as GetProcessCount from '../src/parts/GetProcessCount/GetProcessCount.ts'

test('getProcessCountForRoots - counts all descendants including roots', async () => {
  const getDescendantPids = async (pid: number): Promise<readonly number[]> => {
    if (pid === 1) {
      return [1, 2, 3]
    }
    if (pid === 4) {
      return [4, 5]
    }
    return [pid]
  }
  const isAlive = () => true

  expect(await GetProcessCount.getProcessCountForRoots([1, 4], getDescendantPids, isAlive)).toBe(5)
})

test('getProcessCountForRoots - deduplicates overlapping process trees', async () => {
  const getDescendantPids = async (pid: number): Promise<readonly number[]> => {
    if (pid === 1) {
      return [1, 2, 3]
    }
    if (pid === 2) {
      return [2, 3]
    }
    return [pid]
  }
  const isAlive = () => true

  expect(await GetProcessCount.getProcessCountForRoots([1, 2], getDescendantPids, isAlive)).toBe(3)
})

test('getProcessCountForRoots - ignores exited processes', async () => {
  const getDescendantPids = async (): Promise<readonly number[]> => {
    return [1, 2, 3]
  }
  const isAlive = (pid: number) => pid !== 2

  expect(await GetProcessCount.getProcessCountForRoots([1], getDescendantPids, isAlive)).toBe(2)
})
