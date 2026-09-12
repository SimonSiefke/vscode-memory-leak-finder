import { expect, jest, test } from '@jest/globals'

const takeHeapSnapshot = jest.fn()
const invoke = jest.fn()
const dispose = jest.fn()

jest.unstable_mockModule('../src/parts/HeapSnapshot/HeapSnapshot.ts', () => ({ takeHeapSnapshot }))
jest.unstable_mockModule('../src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts', () => ({
  launchHeapSnapshotWorker: async () => ({ [Symbol.asyncDispose]: dispose, invoke }),
}))

const MeasureArrayBufferBytes = await import('../src/parts/MeasureArrayBufferBytes/MeasureArrayBufferBytes.ts')

test('captures two heap snapshots and compares their backing-store bytes', async () => {
  const session = {} as any
  const [, state] = MeasureArrayBufferBytes.create(session)
  const before = await MeasureArrayBufferBytes.start(session, state)
  const after = await MeasureArrayBufferBytes.stop(session, state)
  await MeasureArrayBufferBytes.releaseResources(session, state)
  invoke.mockImplementation(async () => ({ isLeak: true }))
  await expect(MeasureArrayBufferBytes.compare(before, after)).resolves.toEqual({ isLeak: true })
  expect(takeHeapSnapshot).toHaveBeenNthCalledWith(1, session, state.beforePath)
  expect(takeHeapSnapshot).toHaveBeenNthCalledWith(2, session, state.afterPath)
  expect(invoke).toHaveBeenCalledWith('HeapSnapshot.compareArrayBufferBytes', state.beforePath, state.afterPath)
})

test('reports growth as a leak', () => {
  expect(MeasureArrayBufferBytes.isLeak({ isLeak: true })).toBe(true)
  expect(MeasureArrayBufferBytes.isLeak({ isLeak: false })).toBe(false)
})
