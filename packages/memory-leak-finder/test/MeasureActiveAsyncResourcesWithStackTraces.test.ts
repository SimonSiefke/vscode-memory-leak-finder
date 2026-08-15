import { expect, jest, test } from '@jest/globals'

const trackerStart = jest.fn()
const trackerStop = jest.fn()
const cleanup = jest.fn()

jest.unstable_mockModule('../src/parts/AsyncResourceTracker/AsyncResourceTracker.ts', () => ({
  cleanup,
  start: trackerStart,
  stop: trackerStop,
}))

const Measure = await import('../src/parts/MeasureActiveAsyncResourcesWithStackTraces/MeasureActiveAsyncResourcesWithStackTraces.ts')

test('starts the Node async hook, returns grouped live resources, and tears it down', async () => {
  const session = {} as any
  const [, state] = Measure.create(session)
  trackerStop.mockImplementation(async () => [{ count: 2, stackTrace: [], type: 'Timeout' }])
  await Measure.start(session, state)
  const after = await Measure.stop(session, state)
  expect(after.resources).toEqual([{ count: 2, stackTrace: [], type: 'Timeout' }])
  expect(trackerStart).toHaveBeenCalledWith(session)
})
