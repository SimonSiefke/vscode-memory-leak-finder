import { beforeEach, expect, jest, test } from '@jest/globals'

const cleanup = jest.fn<(_session: unknown) => Promise<void>>()
const getCounts = jest.fn<(_session: unknown) => Promise<{ created: number; revoked: number; unreleased: number }>>()
const startTracking = jest.fn<(_session: unknown) => Promise<void>>()

jest.unstable_mockModule('../src/parts/ObjectUrlTracker/ObjectUrlTracker.ts', () => ({
  cleanup,
  getCounts,
  start: startTracking,
}))

const GetMeasure = await import('../src/parts/GetMeasure/GetMeasure.ts')
const Measures = await import('../src/parts/Measures/Measures.ts')
const MeasureObjectUrlCount = await import('../src/parts/MeasureObjectUrlCount/MeasureObjectUrlCount.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('measures object URL lifecycle calls in the browser', async () => {
  const session = {} as any
  getCounts.mockResolvedValueOnce({ created: 3, revoked: 1, unreleased: 2 })

  const args = MeasureObjectUrlCount.create(session) as [any]
  const before = await MeasureObjectUrlCount.start(...args)
  const after = await MeasureObjectUrlCount.stop(...args)
  await MeasureObjectUrlCount.releaseResources(...args)
  const result = MeasureObjectUrlCount.compare(before, after)

  expect(MeasureObjectUrlCount.id).toBe('objectUrlCount')
  expect(MeasureObjectUrlCount.targets).toEqual([1])
  expect(startTracking).toHaveBeenCalledWith(session)
  expect(cleanup).toHaveBeenCalledWith(session)
  expect(result).toEqual({ created: 3, revoked: 1, unreleased: 2 })
  expect(MeasureObjectUrlCount.isLeak(result)).toBe(true)
  expect(MeasureObjectUrlCount.summary(result)).toBe('Object URLs: 3 created, 1 revoked, 2 unreleased')
})

test('does not report a leak when every created object URL is revoked', () => {
  expect(MeasureObjectUrlCount.isLeak({ created: 2, revoked: 2, unreleased: 0 })).toBe(false)
})

test('resolves the public kebab-case measure id', () => {
  expect(GetMeasure.getMeasure({ Measures }, 'object-url-count')).toBe(Measures.MeasureObjectUrlCount)
})
