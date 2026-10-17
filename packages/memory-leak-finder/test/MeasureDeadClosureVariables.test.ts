import { expect, jest, test } from '@jest/globals'
import { mkdir, writeFile, access } from 'node:fs/promises'
import { dirname } from 'node:path'

const takeHeapSnapshot = jest.fn<(...args: unknown[]) => Promise<void>>()
const invoke = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const dispose = jest.fn()
jest.unstable_mockModule('../src/parts/HeapSnapshot/HeapSnapshot.ts', () => ({ takeHeapSnapshot }))
jest.unstable_mockModule('../src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts', () => ({
  launchHeapSnapshotWorker: async () => ({ [Symbol.asyncDispose]: dispose, invoke }),
}))
const measure = await import('../src/parts/MeasureDeadClosureVariables/MeasureDeadClosureVariables.ts')
const { getMeasure } = await import('../src/parts/GetMeasure/GetMeasure.ts')
const { loadMemoryLeakFinder } = await import('../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts')

test('registers the public measure and captures numeric values and internal metadata', async () => {
  expect(getMeasure(loadMemoryLeakFinder(), 'dead-closure-variables').id).toBe(measure.id)
  expect(measure.targets).toHaveLength(3)
  const args = measure.create({} as any)
  const before = await measure.start(...args)
  const after = await measure.stop(...args)
  expect(before).not.toBe(after)
  expect(takeHeapSnapshot).toHaveBeenCalledWith(args[0], before, { exposeInternals: true, captureNumericValues: true })
  expect(takeHeapSnapshot).toHaveBeenCalledWith(args[0], after, { exposeInternals: true, captureNumericValues: true })
  const report = { before: 100, after: 200, delta: 100, afterDetails: { closures: [] } }
  invoke.mockResolvedValueOnce(report)
  await expect(measure.compare(before, after)).resolves.toEqual(report)
  expect(invoke).toHaveBeenCalledWith('HeapSnapshot.compareDeadClosureVariables', before, after)
  expect(dispose).toHaveBeenCalled()
})

test.each([
  [100, 200, true],
  [100, 100, false],
  [200, 100, false],
])('only byte growth is a leak: %s -> %s', (before, after, leak) => {
  expect(measure.isLeak({ before, after })).toBe(leak)
})

test('cleans up both snapshots when analysis fails', async () => {
  const [, state] = measure.create({} as any)
  await mkdir(dirname(state.beforePath), { recursive: true })
  await Promise.all([writeFile(state.beforePath, '{}'), writeFile(state.afterPath, '{}')])
  invoke.mockRejectedValueOnce(new Error('unsupported scope metadata'))
  await expect(measure.compare(state.beforePath, state.afterPath)).rejects.toThrow('unsupported scope metadata')
  await expect(access(state.beforePath)).rejects.toThrow()
  await expect(access(state.afterPath)).rejects.toThrow()
})

test('cleans up captures when a run is interrupted before comparison', async () => {
  const args = measure.create({} as any)
  await mkdir(dirname(args[1].beforePath), { recursive: true })
  await writeFile(args[1].beforePath, '{}')
  await measure.releaseResources(...args)
  await expect(access(args[1].beforePath)).rejects.toThrow()
})

test('preserves completed captures across stop resource release until comparison', async () => {
  const args = measure.create({} as any)
  await mkdir(dirname(args[1].beforePath), { recursive: true })
  await Promise.all([writeFile(args[1].beforePath, '{}'), writeFile(args[1].afterPath, '{}')])
  await measure.stop(...args)
  await measure.releaseResources(...args)
  await expect(access(args[1].beforePath)).resolves.toBeUndefined()
  await expect(access(args[1].afterPath)).resolves.toBeUndefined()
  invoke.mockResolvedValueOnce({ before: 0, after: 0 })
  await measure.compare(args[1].beforePath, args[1].afterPath)
  await expect(access(args[1].afterPath)).rejects.toThrow()
})
