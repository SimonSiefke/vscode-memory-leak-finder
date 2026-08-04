import { beforeEach, expect, jest, test } from '@jest/globals'

const invoke = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const dispose = jest.fn()

jest.unstable_mockModule('../src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts', () => ({
  launchHeapSnapshotWorker: async () => ({
    invoke,
    [Symbol.asyncDispose]: dispose,
  }),
}))

const MeasureConcatenatedStrings = await import('../src/parts/MeasureConcatenatedStrings/MeasureConcatenatedStrings.ts')
const MeasureDuplicatedStrings = await import('../src/parts/MeasureDuplicatedStrings/MeasureDuplicatedStrings.ts')

interface StringCollectionMeasure {
  readonly isLeak: (comparison: { readonly after: readonly string[]; readonly before: readonly string[] }) => boolean
}

beforeEach(() => {
  jest.clearAllMocks()
})

test.each([
  {
    command: 'HeapSnapshot.compareConcatenatedStrings',
    id: 'concatenatedStrings',
    measure: MeasureConcatenatedStrings,
  },
  {
    command: 'HeapSnapshot.compareDuplicatedStrings',
    id: 'duplicatedStrings',
    measure: MeasureDuplicatedStrings,
  },
])('$id uses the public measure id and returns string arrays from the heap snapshot worker', async ({ command, id, measure }) => {
  const comparison = {
    after: ['after'],
    before: ['before'],
  }
  invoke.mockResolvedValue(comparison)

  expect(measure.id).toBe(id)
  expect(measure.targets).toEqual([1, 2, 3])
  await expect(measure.compare('/tmp/before.heapsnapshot', '/tmp/after.heapsnapshot')).resolves.toEqual(comparison)
  expect(invoke).toHaveBeenCalledWith(command, '/tmp/before.heapsnapshot', '/tmp/after.heapsnapshot')
  expect(dispose).toHaveBeenCalledTimes(1)
})

test.each<StringCollectionMeasure>([MeasureConcatenatedStrings, MeasureDuplicatedStrings])(
  'reports a leak when the string array grows',
  (measure) => {
    expect(measure.isLeak({ after: ['one', 'two'], before: ['one'] })).toBe(true)
    expect(measure.isLeak({ after: ['one'], before: ['one'] })).toBe(false)
    expect(measure.isLeak({ after: [], before: ['one'] })).toBe(false)
  },
)
