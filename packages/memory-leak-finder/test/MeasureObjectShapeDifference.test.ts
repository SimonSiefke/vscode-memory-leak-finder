import { expect, jest, test } from '@jest/globals'

const takeHeapSnapshot = jest.fn()
const invoke = jest.fn()

jest.unstable_mockModule('../src/parts/HeapSnapshot/HeapSnapshot.ts', () => ({ takeHeapSnapshot }))
jest.unstable_mockModule('../src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts', () => ({
  launchHeapSnapshotWorker: async () => ({ [Symbol.asyncDispose]: jest.fn(), invoke }),
}))

const MeasureObjectShapeDifference = await import('../src/parts/MeasureObjectShapeDifference/MeasureObjectShapeDifference.ts')

test('captures two heap snapshots and compares shapes using the run threshold', async () => {
  const session = {} as any
  const [, state] = MeasureObjectShapeDifference.create(session)
  const before = await MeasureObjectShapeDifference.start(session, state)
  const after = await MeasureObjectShapeDifference.stop(session, state)
  await MeasureObjectShapeDifference.releaseResources(session, state)
  invoke.mockImplementation(async () => ({ isLeak: true }))
  await expect(MeasureObjectShapeDifference.compare(before, after, { runs: 4 })).resolves.toEqual({ isLeak: true })
  expect(takeHeapSnapshot).toHaveBeenNthCalledWith(1, session, state.beforePath)
  expect(takeHeapSnapshot).toHaveBeenNthCalledWith(2, session, state.afterPath)
  expect(invoke).toHaveBeenCalledWith('HeapSnapshot.compareObjectShapeDifference', state.beforePath, state.afterPath, 4)
})
