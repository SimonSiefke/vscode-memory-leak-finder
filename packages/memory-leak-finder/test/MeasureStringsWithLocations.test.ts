import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const takeHeapSnapshot = jest.fn<(session: unknown, path: string) => Promise<void>>()
const invoke = jest.fn<(...args: unknown[]) => Promise<any>>()
const dispose = jest.fn<() => Promise<void>>()
const scriptStart = jest.fn<(...args: unknown[]) => Promise<void>>()
const scriptStop = jest.fn<(...args: unknown[]) => Promise<void>>()
const scriptMap: Record<string, { url: string }> = {}

jest.unstable_mockModule('../src/parts/HeapSnapshot/HeapSnapshot.ts', () => ({ takeHeapSnapshot }))
jest.unstable_mockModule('../src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts', () => ({
  launchHeapSnapshotWorker: async () => ({ invoke, [Symbol.asyncDispose]: dispose }),
}))
jest.unstable_mockModule('../src/parts/ScriptHandler/ScriptHandler.ts', () => ({
  create: () => ({ scriptMap, start: scriptStart, stop: scriptStop }),
}))

const Measure = await import('../src/parts/MeasureStringsWithLocations/MeasureStringsWithLocations.ts')
const { getMeasure } = await import('../src/parts/GetMeasure/GetMeasure.ts')
const { loadMemoryLeakFinder } = await import('../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts')
const TargetId = await import('../src/parts/TargetId/TargetId.ts')
const states: { beforePath: string; afterPath: string }[] = []
const session = {} as any
const create = () => {
  const [, state] = Measure.create(session)
  states.push(state)
  return state
}

beforeEach(() => {
  jest.resetAllMocks()
  for (const key of Object.keys(scriptMap)) delete scriptMap[key]
  takeHeapSnapshot.mockImplementation(async (_session, path) => {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, '{}')
  })
  invoke.mockResolvedValue({ before: [], after: [{ string: 'output', sourceLocation: null, count: 12 }] })
})

afterEach(async () => {
  await Promise.all(states.splice(0).flatMap((state) => [rm(state.beforePath, { force: true }), rm(state.afterPath, { force: true })]))
})

test('registers the public measure and supports browser, Node, and worker targets', () => {
  expect(getMeasure(loadMemoryLeakFinder(), 'strings-with-locations').id).toBe('stringsWithLocations')
  expect(Measure.targets).toEqual([TargetId.Browser, TargetId.Node, TargetId.Worker])
})

test('captures script maps separately, releases debugger listeners before comparison, and cleans snapshots', async () => {
  const state = create()
  scriptMap['7'] = { url: 'before.js' }
  const before = await Measure.start(session, state)
  scriptMap['7'] = { url: 'after.js' }
  scriptMap['8'] = { url: 'new.js' }
  const after = await Measure.stop(session, state)
  await Measure.releaseResources(session, state)
  await Measure.releaseResources(session, state)
  expect(scriptStart).toHaveBeenCalledWith(session)
  expect(scriptStop).toHaveBeenCalledTimes(1)
  expect(before.scriptMap).toEqual({ '7': { url: 'before.js' } })
  expect(existsSync(before.heapSnapshotPath)).toBe(true)
  expect(existsSync(after.heapSnapshotPath)).toBe(true)
  const result = await Measure.compare(before, after)
  expect(result).toEqual([{ string: 'output', sourceLocation: null, location: null, count: 12, beforeCount: 0, afterCount: 12 }])
  expect(invoke).toHaveBeenCalledWith(
    'HeapSnapshot.compareStringsWithLocations',
    before.heapSnapshotPath,
    after.heapSnapshotPath,
    before.scriptMap,
    after.scriptMap,
  )
  expect(dispose).toHaveBeenCalledTimes(1)
  expect(existsSync(before.heapSnapshotPath)).toBe(false)
  expect(existsSync(after.heapSnapshotPath)).toBe(false)
  expect(Measure.isLeak(result)).toBe(true)
  expect(Measure.isLeak([])).toBe(false)
})

test('cleans snapshots after comparison fails', async () => {
  const state = create()
  const before = await Measure.start(session, state)
  const after = await Measure.stop(session, state)
  await Measure.releaseResources(session, state)
  invoke.mockRejectedValueOnce(new Error('worker failed'))
  await expect(Measure.compare(before, after)).rejects.toThrow('worker failed')
  expect(dispose).toHaveBeenCalledTimes(1)
  expect(existsSync(state.beforePath)).toBe(false)
  expect(existsSync(state.afterPath)).toBe(false)
})

test('removes debugger listeners when enabling debugger or initial capture fails', async () => {
  const state = create()
  scriptStart.mockRejectedValueOnce(new Error('debugger failed'))
  await expect(Measure.start(session, state)).rejects.toThrow('debugger failed')
  expect(scriptStop).toHaveBeenCalledTimes(1)
  takeHeapSnapshot.mockRejectedValueOnce(new Error('snapshot failed'))
  await expect(Measure.start(session, state)).rejects.toThrow('snapshot failed')
  expect(scriptStop).toHaveBeenCalledTimes(2)
  expect(existsSync(state.beforePath)).toBe(false)
})

test('cleans abandoned captures and failed final snapshots', async () => {
  const abandoned = create()
  await Measure.start(session, abandoned)
  await Measure.releaseResources(session, abandoned)
  expect(existsSync(abandoned.beforePath)).toBe(false)
  const failed = create()
  await Measure.start(session, failed)
  takeHeapSnapshot.mockRejectedValueOnce(new Error('snapshot failed'))
  await expect(Measure.stop(session, failed)).rejects.toThrow('snapshot failed')
  await Measure.releaseResources(session, failed)
  expect(existsSync(failed.beforePath)).toBe(false)
  expect(existsSync(failed.afterPath)).toBe(false)
})

test('removes completed snapshots if releasing the debugger fails before comparison', async () => {
  const state = create()
  await Measure.start(session, state)
  await Measure.stop(session, state)
  scriptStop.mockRejectedValueOnce(new Error('debugger failed'))
  await expect(Measure.releaseResources(session, state)).rejects.toThrow('debugger failed')
  expect(existsSync(state.beforePath)).toBe(false)
  expect(existsSync(state.afterPath)).toBe(false)
})
