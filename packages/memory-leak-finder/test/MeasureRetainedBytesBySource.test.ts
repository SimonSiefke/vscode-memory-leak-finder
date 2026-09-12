import { expect, jest, test } from '@jest/globals'

const enable = jest.fn()
const disable = jest.fn()
const startTrackingHeapObjects = jest.fn()
const takeTrackingHeapSnapshot = jest.fn()
const forceGarbageCollection = jest.fn()
const invoke = jest.fn()

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolHeapProfiler: { disable, enable, startTrackingHeapObjects },
}))
jest.unstable_mockModule('../src/parts/ForceGarbageCollection/ForceGarbageCollection.ts', () => ({ forceGarbageCollection }))
jest.unstable_mockModule('../src/parts/HeapSnapshot/HeapSnapshot.ts', () => ({ takeTrackingHeapSnapshot }))
jest.unstable_mockModule('../src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts', () => ({
  launchHeapSnapshotWorker: async () => ({ [Symbol.asyncDispose]: jest.fn(), invoke }),
}))

const MeasureRetainedBytesBySource = await import('../src/parts/MeasureRetainedBytesBySource/MeasureRetainedBytesBySource.ts')

test('tracks allocations and reports retained bytes with the run threshold', async () => {
  const session = {} as any
  const scriptHandler = { scriptMap: { 1: { url: 'test.js' } }, start: jest.fn(), stop: jest.fn() }
  const [, state] = MeasureRetainedBytesBySource.create(session)
  ;(state as any).scriptHandler = scriptHandler
  await MeasureRetainedBytesBySource.start(session, state)
  const after = await MeasureRetainedBytesBySource.stop(session, state)
  invoke.mockImplementation(async () => ({ isLeak: true }))
  await expect(MeasureRetainedBytesBySource.compare(undefined, after, { runs: 3 })).resolves.toEqual({ isLeak: true })
  expect(startTrackingHeapObjects).toHaveBeenCalledWith(session, { trackAllocations: true })
  expect(takeTrackingHeapSnapshot).toHaveBeenCalledWith(session, state.heapSnapshotPath)
  expect(invoke).toHaveBeenCalledWith('HeapSnapshot.createRetainedBytesBySource', state.heapSnapshotPath, scriptHandler.scriptMap, 3)
})
