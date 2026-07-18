import { beforeEach, expect, jest, test } from '@jest/globals'

const collectGarbage = jest.fn()
const disable = jest.fn()
const enable = jest.fn()
const startTrackingHeapObjects = jest.fn()
const takeHeapSnapshot = jest.fn()
const takeTrackingHeapSnapshot = jest.fn()
const invoke = jest.fn()
const dispose = jest.fn()
const resolveRetainerRiverSourceMaps = jest.fn()

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolHeapProfiler: {
    collectGarbage,
    disable,
    enable,
    startTrackingHeapObjects,
  },
}))

jest.unstable_mockModule('../src/parts/HeapSnapshot/HeapSnapshot.ts', () => ({
  takeHeapSnapshot,
  takeTrackingHeapSnapshot,
}))

jest.unstable_mockModule('../src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts', () => ({
  launchHeapSnapshotWorker: async () => ({
    invoke,
    [Symbol.asyncDispose]: dispose,
  }),
}))

jest.unstable_mockModule('../src/parts/ResolveRetainerRiverSourceMaps/ResolveRetainerRiverSourceMaps.ts', () => ({
  resolveRetainerRiverSourceMaps,
}))

const MeasureRetainerRiver = await import('../src/parts/MeasureRetainerRiver/MeasureRetainerRiver.ts')

const session = {} as any
const state = { directory: '/tmp/retainer-river' }
const scriptHandler: any = {
  scriptMap: { 17: { url: 'bundle.js' } },
  start: jest.fn(),
  stop: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  invoke.mockResolvedValue({ isLeak: true, metadata: {} } as never)
  resolveRetainerRiverSourceMaps.mockImplementation(async (value) => value)
})

test('MeasureRetainerRiver starts allocation tracking before the baseline snapshot', async () => {
  await expect(MeasureRetainerRiver.start(session, state, scriptHandler)).resolves.toBe('/tmp/retainer-river/before.heapsnapshot')

  expect(scriptHandler.start).toHaveBeenCalledWith(session)
  expect(enable).toHaveBeenCalledWith(session)
  expect(startTrackingHeapObjects).toHaveBeenCalledWith(session, { trackAllocations: true })
  expect(takeHeapSnapshot).toHaveBeenCalledWith(session, '/tmp/retainer-river/before.heapsnapshot')
  expect(startTrackingHeapObjects.mock.invocationCallOrder[0]).toBeLessThan(takeHeapSnapshot.mock.invocationCallOrder[0])
})

test('MeasureRetainerRiver collects before stopping tracking and returns script metadata', async () => {
  const result = await MeasureRetainerRiver.stop(session, state, scriptHandler)

  expect(collectGarbage).toHaveBeenCalledWith(session)
  expect(takeTrackingHeapSnapshot).toHaveBeenCalledWith(session, '/tmp/retainer-river/after.heapsnapshot')
  expect(scriptHandler.stop).toHaveBeenCalledWith(session)
  expect(result).toEqual({
    heapSnapshotPath: '/tmp/retainer-river/after.heapsnapshot',
    scriptMap: scriptHandler.scriptMap,
  })
})

test('MeasureRetainerRiver builds and source-maps the report with run metadata', async () => {
  const after = {
    heapSnapshotPath: '/tmp/after.heapsnapshot',
    scriptMap: scriptHandler.scriptMap,
  }

  const result = await MeasureRetainerRiver.compare('/tmp/before.heapsnapshot', after, {
    processType: 'node',
    resultPath: '/results/editor-retainers.json',
    runs: 4,
  })

  expect(invoke).toHaveBeenCalledWith('HeapSnapshot.getRetainerRiver', '/tmp/before.heapsnapshot', '/tmp/after.heapsnapshot', 4)
  expect(resolveRetainerRiverSourceMaps).toHaveBeenCalledWith({ isLeak: true, metadata: {} }, scriptHandler.scriptMap)
  expect(dispose).toHaveBeenCalled()
  expect(result).toMatchObject({
    isLeak: true,
    metadata: {
      processType: 'node',
      runs: 4,
      testName: 'editor-retainers',
    },
  })
})

test('MeasureRetainerRiver disables the heap profiler during resource release', async () => {
  await MeasureRetainerRiver.releaseResources(session)
  expect(disable).toHaveBeenCalledWith(session, {})
})
