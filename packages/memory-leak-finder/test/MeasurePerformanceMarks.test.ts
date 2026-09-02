import { expect, jest, test } from '@jest/globals'

const takeHeapSnapshot = jest.fn()
const invoke = jest.fn<(...args: unknown[]) => Promise<any>>()
const dispose = jest.fn()

jest.unstable_mockModule('../src/parts/HeapSnapshot/HeapSnapshot.ts', () => ({ takeHeapSnapshot }))
jest.unstable_mockModule('../src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts', () => ({
  launchHeapSnapshotWorker: async () => ({ [Symbol.asyncDispose]: dispose, invoke }),
}))

const GetMeasure = await import('../src/parts/GetMeasure/GetMeasure.ts')
const LoadMemoryLeakFinder = await import('../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts')
const MeasurePerformanceMarkBytes = await import('../src/parts/MeasurePerformanceMarkBytes/MeasurePerformanceMarkBytes.ts')
const MeasurePerformanceMarkCounts = await import('../src/parts/MeasurePerformanceMarkCounts/MeasurePerformanceMarkCounts.ts')

test.each([
  {
    measure: MeasurePerformanceMarkCounts,
    metric: 'count',
    publicId: 'performance-mark-counts',
    value: { after: 696, before: 688 },
  },
  {
    measure: MeasurePerformanceMarkBytes,
    metric: 'bytes',
    publicId: 'performance-mark-bytes',
    value: { after: 89_088, before: 88_064 },
  },
])('$publicId captures snapshots and returns the $metric comparison', async ({ measure, metric, publicId, value }) => {
  const session = {} as any
  const args = measure.create(session) as [any, any]
  const beforePath = await measure.start(...args)
  const afterPath = await measure.stop(...args)
  invoke.mockResolvedValueOnce({
    after: { bytes: 89_088, count: 696 },
    before: { bytes: 88_064, count: 688 },
    delta: { bytes: 1_024, count: 8 },
  })

  await expect(measure.compare(beforePath, afterPath)).resolves.toEqual(value)
  expect(takeHeapSnapshot).toHaveBeenNthCalledWith(takeHeapSnapshot.mock.calls.length - 1, session, beforePath)
  expect(takeHeapSnapshot).toHaveBeenNthCalledWith(takeHeapSnapshot.mock.calls.length, session, afterPath)
  expect(invoke).toHaveBeenLastCalledWith('HeapSnapshot.comparePerformanceMarks', beforePath, afterPath)
  expect(measure.isLeak(value)).toBe(true)

  const resolvedMeasure = GetMeasure.getMeasure(LoadMemoryLeakFinder.loadMemoryLeakFinder(), publicId)
  expect(resolvedMeasure.id).toBe(measure.id)
})
