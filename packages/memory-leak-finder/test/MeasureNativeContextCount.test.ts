import { expect, jest, test } from '@jest/globals'

const takeHeapSnapshot = jest.fn()
const invoke = jest.fn()
const dispose = jest.fn()

jest.unstable_mockModule('../src/parts/HeapSnapshot/HeapSnapshot.ts', () => ({ takeHeapSnapshot }))
jest.unstable_mockModule('../src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts', () => ({
  launchHeapSnapshotWorker: async () => ({ [Symbol.asyncDispose]: dispose, invoke }),
}))

const MeasureNativeContextCount = await import('../src/parts/MeasureNativeContextCount/MeasureNativeContextCount.ts')

test('captures two heap snapshots and compares their NativeContext counts', async () => {
  const session = {} as any
  const [, state] = MeasureNativeContextCount.create(session)
  const before = await MeasureNativeContextCount.start(session, state)
  const after = await MeasureNativeContextCount.stop(session, state)
  await MeasureNativeContextCount.releaseResources(session, state)
  invoke.mockImplementation(async () => ({ isLeak: true }))
  await expect(MeasureNativeContextCount.compare(before, after)).resolves.toEqual({ isLeak: true })
  expect(takeHeapSnapshot).toHaveBeenNthCalledWith(1, session, state.beforePath)
  expect(takeHeapSnapshot).toHaveBeenNthCalledWith(2, session, state.afterPath)
  expect(invoke).toHaveBeenCalledWith('HeapSnapshot.compareNativeContextCount', state.beforePath, state.afterPath)
})

test('reports context growth as a leak', () => {
  expect(MeasureNativeContextCount.isLeak({ isLeak: true })).toBe(true)
  expect(MeasureNativeContextCount.isLeak({ isLeak: false })).toBe(false)
})
