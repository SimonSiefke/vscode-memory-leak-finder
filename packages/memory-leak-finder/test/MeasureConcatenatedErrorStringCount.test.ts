import { beforeEach, expect, jest, test } from '@jest/globals'

const invoke = jest.fn()
const dispose = jest.fn()

jest.unstable_mockModule('../src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts', () => ({
  launchHeapSnapshotWorker: async () => ({
    invoke,
    [Symbol.asyncDispose]: dispose,
  }),
}))

const MeasureConcatenatedErrorStringCount =
  await import('../src/parts/MeasureConcatenatedErrorStringCount/MeasureConcatenatedErrorStringCount.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('uses the public measure id and supports browser, Node, and worker targets', () => {
  expect(MeasureConcatenatedErrorStringCount.id).toBe('concatenatedErrorStringCount')
  expect(MeasureConcatenatedErrorStringCount.targets).toEqual([1, 2, 3])
})

test('compares snapshot paths through the heap snapshot worker', async () => {
  const events: string[] = []
  const comparison = {
    after: 0,
    before: 2386,
    delta: -2386,
    totalAfter: 27759,
    totalBefore: 27792,
    totalDelta: -33,
  }
  invoke.mockImplementation(async () => {
    events.push('invoke started')
    await Promise.resolve()
    events.push('invoke settled')
    return comparison
  })
  dispose.mockImplementation(async () => {
    events.push('disposed')
  })

  await expect(MeasureConcatenatedErrorStringCount.compare('/tmp/before.heapsnapshot', '/tmp/after.heapsnapshot')).resolves.toEqual(
    comparison,
  )

  expect(invoke).toHaveBeenCalledWith(
    'HeapSnapshot.compareConcatenatedErrorStringCount',
    '/tmp/before.heapsnapshot',
    '/tmp/after.heapsnapshot',
  )
  expect(events).toEqual(['invoke started', 'invoke settled', 'disposed'])
})

test('reports a leak only when the matching count grows', () => {
  const comparison = {
    after: 5,
    before: 4,
    delta: 1,
    totalAfter: 10,
    totalBefore: 9,
    totalDelta: 1,
  }

  expect(MeasureConcatenatedErrorStringCount.isLeak(comparison)).toBe(true)
  expect(
    MeasureConcatenatedErrorStringCount.isLeak({
      ...comparison,
      after: 4,
      delta: 0,
    }),
  ).toBe(false)
})
