import { beforeEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as TargetId from '../src/parts/TargetId/TargetId.ts'
import type { Session } from '../src/parts/Session/Session.ts'

const takeHeapSnapshot = jest.fn(async (_session: Session, _path: string) => {})
const invoke = jest.fn(async (..._args: unknown[]): Promise<unknown> => ({ isLeak: true }))
const dispose = jest.fn(async () => {})
jest.unstable_mockModule('../src/parts/HeapSnapshot/HeapSnapshot.ts', () => ({ takeHeapSnapshot }))
jest.unstable_mockModule('../src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts', () => ({
  launchHeapSnapshotWorker: async () => ({ [Symbol.asyncDispose]: dispose, invoke }),
}))
const Measure = await import('../src/parts/MeasureRetainedSubstrings/MeasureRetainedSubstrings.ts')
beforeEach(() => {
  jest.clearAllMocks()
})

test('captures unique snapshots for browser, node, and worker targets', async () => {
  const session = {} as Session
  const [, state] = Measure.create(session)
  const [, other] = Measure.create(session)
  expect(other.beforePath).not.toBe(state.beforePath)
  expect(Measure.targets).toEqual([TargetId.Browser, TargetId.Node, TargetId.Worker])
  expect(await Measure.start(session, state)).toBe(state.beforePath)
  expect(await Measure.stop(session, state)).toBe(state.afterPath)
  expect(takeHeapSnapshot.mock.calls).toEqual([
    [session, state.beforePath],
    [session, state.afterPath],
  ])
  await Measure.releaseResources(session, state)
})

test.each([false, true])('removes snapshots and disposes the RPC after comparison (failure: %s)', async (fail) => {
  const directory = await mkdtemp(join(tmpdir(), 'retained-substrings-'))
  const before = join(directory, 'before.json')
  const after = join(directory, 'after.json')
  try {
    await writeFile(before, '{}')
    await writeFile(after, '{}')
    invoke.mockImplementationOnce(async () => {
      if (fail) throw new Error('comparison failed')
      return { isLeak: true }
    })
    const result = Measure.compare(before, after)
    if (fail) await expect(result).rejects.toThrow('comparison failed')
    else await expect(result).resolves.toEqual({ isLeak: true })
    expect(invoke).toHaveBeenCalledWith('HeapSnapshot.compareRetainedSubstrings', before, after)
    expect(dispose).toHaveBeenCalledTimes(1)
    await expect(readFile(before)).rejects.toThrow()
    await expect(readFile(after)).rejects.toThrow()
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('cleans partial snapshots when capture fails', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'retained-substrings-'))
  const session = {} as Session
  const state = { captured: false, beforePath: join(directory, 'before'), afterPath: join(directory, 'after') }
  try {
    await writeFile(state.beforePath, '{}')
    await writeFile(state.afterPath, 'partial')
    takeHeapSnapshot.mockRejectedValueOnce(new Error('capture failed'))
    await expect(Measure.stop(session, state)).rejects.toThrow('capture failed')
    await Measure.releaseResources(session, state)
    await expect(readFile(state.beforePath)).rejects.toThrow()
    await expect(readFile(state.afterPath)).rejects.toThrow()
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('reports only explicit growth signals as leaks', () => {
  expect(Measure.isLeak({ isLeak: true })).toBe(true)
  expect(Measure.isLeak({ isLeak: false })).toBe(false)
  expect(Measure.isLeak(undefined)).toBe(false)
})
