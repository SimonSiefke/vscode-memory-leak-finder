import { expect, jest, test } from '@jest/globals'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const takeHeapSnapshot = jest.fn<(...args: unknown[]) => Promise<void>>()
const invoke = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const dispose = jest.fn()
jest.unstable_mockModule('../src/parts/HeapSnapshot/HeapSnapshot.ts', () => ({ takeHeapSnapshot }))
jest.unstable_mockModule('../src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts', () => ({
  launchHeapSnapshotWorker: async () => ({ [Symbol.asyncDispose]: dispose, invoke }),
}))
const measure = await import('../src/parts/MeasureDuplicateObjectGraphs/MeasureDuplicateObjectGraphs.ts')
const { getMeasure } = await import('../src/parts/GetMeasure/GetMeasure.ts')
const { loadMemoryLeakFinder } = await import('../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts')

test('registers duplicate-object-graphs and captures numeric property values', async () => {
  expect(getMeasure(loadMemoryLeakFinder(), 'duplicate-object-graphs').id).toBe(measure.id)
  expect(measure.targets).toHaveLength(3)
  const args = measure.create({} as any)
  const before = await measure.start(...args)
  const after = await measure.stop(...args)
  expect(before).not.toBe(after)
  expect(takeHeapSnapshot).toHaveBeenCalledWith(args[0], before, { captureNumericValues: true })
  expect(takeHeapSnapshot).toHaveBeenCalledWith(args[0], after, { captureNumericValues: true })
  const result = { before: 32, after: 64, delta: 32 }
  invoke.mockResolvedValueOnce(result)
  await expect(measure.compare(before, after)).resolves.toEqual(result)
  expect(invoke).toHaveBeenCalledWith('HeapSnapshot.compareDuplicateObjectGraphs', before, after)
  expect(dispose).toHaveBeenCalled()
})

test.each([
  [32, 64, true],
  [32, 32, false],
  [64, 32, false],
])('only increasing duplicate bytes leak: %s -> %s', (before, after, leak) => {
  expect(measure.isLeak({ before, after })).toBe(leak)
})

test('preserves snapshots until comparison, then cleans up even on failure', async () => {
  const args = measure.create({} as any)
  await mkdir(dirname(args[1].beforePath), { recursive: true })
  await Promise.all([writeFile(args[1].beforePath, '{}'), writeFile(args[1].afterPath, '{}')])
  await measure.stop(...args)
  await measure.releaseResources(...args)
  await expect(access(args[1].beforePath)).resolves.toBeUndefined()
  invoke.mockRejectedValueOnce(new Error('verification budget exceeded'))
  await expect(measure.compare(args[1].beforePath, args[1].afterPath)).rejects.toThrow('verification budget exceeded')
  await expect(access(args[1].beforePath)).rejects.toThrow()
  await expect(access(args[1].afterPath)).rejects.toThrow()
})

test('cleans up an interrupted capture', async () => {
  const args = measure.create({} as any)
  await mkdir(dirname(args[1].beforePath), { recursive: true })
  await writeFile(args[1].beforePath, '{}')
  await measure.releaseResources(...args)
  await expect(access(args[1].beforePath)).rejects.toThrow()
})
