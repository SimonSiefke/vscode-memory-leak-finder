import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const takeHeapSnapshot = jest.fn<(session: unknown, path: string) => Promise<void>>()
const invoke = jest.fn<(...args: unknown[]) => Promise<any>>()
const dispose = jest.fn<() => Promise<void>>()
const launchHeapSnapshotWorker = jest.fn<() => Promise<any>>()

jest.unstable_mockModule('../src/parts/HeapSnapshot/HeapSnapshot.ts', () => ({ takeHeapSnapshot }))
jest.unstable_mockModule('../src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts', () => ({ launchHeapSnapshotWorker }))

const GetMeasure = await import('../src/parts/GetMeasure/GetMeasure.ts')
const LoadMemoryLeakFinder = await import('../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts')
const Count = await import('../src/parts/MeasureStringObjectCount/MeasureStringObjectCount.ts')
const Bytes = await import('../src/parts/MeasureStringObjectBytes/MeasureStringObjectBytes.ts')
const TargetId = await import('../src/parts/TargetId/TargetId.ts')

const measures = [
  { measure: Count, publicId: 'string-object-count', value: { after: 12, before: 10 } },
  { measure: Bytes, publicId: 'string-object-bytes', value: { after: 400, before: 320 } },
]
const session = {} as any
const states: { beforePath: string; afterPath: string }[] = []
const create = (measure: typeof Count | typeof Bytes) => {
  const [, state] = measure.create(session)
  states.push(state)
  return state
}

beforeEach(() => {
  jest.resetAllMocks()
  takeHeapSnapshot.mockImplementation(async (_session, path) => {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, '{}')
  })
  launchHeapSnapshotWorker.mockResolvedValue({ [Symbol.asyncDispose]: dispose, invoke })
  invoke.mockResolvedValue({
    after: { bytes: 400, count: 12 },
    before: { bytes: 320, count: 10 },
    delta: { bytes: 80, count: 2 },
  })
})

afterEach(async () => {
  await Promise.all(states.splice(0).flatMap((state) => [rm(state.beforePath, { force: true }), rm(state.afterPath, { force: true })]))
})

test.each(measures)('$publicId preserves snapshots until comparison and then removes them', async ({ measure, value }) => {
  const state = create(measure)
  const before = await measure.start(session, state)
  const after = await measure.stop(session, state)
  await measure.releaseResources(session, state)
  expect(existsSync(before)).toBe(true)
  expect(existsSync(after)).toBe(true)
  expect(takeHeapSnapshot).toHaveBeenNthCalledWith(1, session, before)
  expect(takeHeapSnapshot).toHaveBeenNthCalledWith(2, session, after)

  await expect(measure.compare(before, after)).resolves.toEqual(value)
  expect(invoke).toHaveBeenCalledWith('HeapSnapshot.compareStringObjects', before, after)
  expect(dispose).toHaveBeenCalledTimes(1)
  expect(existsSync(before)).toBe(false)
  expect(existsSync(after)).toBe(false)
})

test.each(measures)('$publicId resolves through CLI naming and supports browser, Node, and worker targets', ({ measure, publicId }) => {
  const resolved = GetMeasure.getMeasure(LoadMemoryLeakFinder.loadMemoryLeakFinder(), publicId)
  expect(resolved.id).toBe(measure.id)
  expect(measure.targets).toEqual([TargetId.Browser, TargetId.Node, TargetId.Worker])
})

test.each(measures)('$publicId flags only positive growth', ({ measure }) => {
  expect(measure.isLeak({ before: 10, after: 12 })).toBe(true)
  expect(measure.isLeak({ before: 10, after: 10 })).toBe(false)
  expect(measure.isLeak({ before: 10, after: 8 })).toBe(false)
})

test('uses unique paths for concurrent captures of either measure', () => {
  const captures = [create(Count), create(Count), create(Bytes)]
  const paths = captures.flatMap((state) => [state.beforePath, state.afterPath])
  expect(new Set(paths).size).toBe(6)
})

test.each(['capture', 'stop'] as const)('removes partial snapshots after a failed %s', async (phase) => {
  const state = create(Count)
  if (phase === 'stop') await Count.start(session, state)
  takeHeapSnapshot.mockImplementationOnce(async (_session, path) => {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, 'partial snapshot')
    throw new Error('capture failed')
  })
  const capture = phase === 'stop' ? Count.stop : Count.start
  await expect(capture(session, state)).rejects.toThrow('capture failed')
  expect(existsSync(state.beforePath)).toBe(false)
  expect(existsSync(state.afterPath)).toBe(false)
})

test.each(['launch', 'compare'] as const)('removes snapshots after worker %s failure', async (phase) => {
  const state = create(Bytes)
  await Bytes.start(session, state)
  await Bytes.stop(session, state)
  if (phase === 'launch') launchHeapSnapshotWorker.mockRejectedValueOnce(new Error('worker failed'))
  else invoke.mockRejectedValueOnce(new Error('worker failed'))

  await expect(Bytes.compare(state.beforePath, state.afterPath)).rejects.toThrow('worker failed')
  expect(existsSync(state.beforePath)).toBe(false)
  expect(existsSync(state.afterPath)).toBe(false)
  expect(dispose).toHaveBeenCalledTimes(phase === 'launch' ? 0 : 1)
})

test('cleans up an aborted capture when resources are released', async () => {
  const state = create(Count)
  await Count.start(session, state)
  await Count.releaseResources(session, state)
  await Count.releaseResources(session, state)
  expect(existsSync(state.beforePath)).toBe(false)
  expect(existsSync(state.afterPath)).toBe(false)
})
