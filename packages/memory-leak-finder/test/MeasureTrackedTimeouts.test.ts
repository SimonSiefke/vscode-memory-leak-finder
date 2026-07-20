import { beforeEach, expect, jest, test } from '@jest/globals'

const mockGetTrackedTimeoutCount = jest.fn<() => Promise<number>>()

jest.unstable_mockModule('../src/parts/GetTrackedTimeoutCount/GetTrackedTimeoutCount.ts', () => ({
  getTrackedTimeoutCount: mockGetTrackedTimeoutCount,
}))

beforeEach(() => {
  jest.clearAllMocks()
})

test('MeasureTrackedTimeouts reads the application-lifetime count before and after the test', async () => {
  mockGetTrackedTimeoutCount.mockResolvedValueOnce(12).mockResolvedValueOnce(15)
  const MeasureTrackedTimeouts = await import('../src/parts/MeasureTrackedTimeouts/MeasureTrackedTimeouts.ts')
  const session = {} as any

  const before = await MeasureTrackedTimeouts.start(session)
  const after = await MeasureTrackedTimeouts.stop(session)

  expect(before).toBe(12)
  expect(after).toBe(15)
  expect(MeasureTrackedTimeouts.compare(before, after)).toEqual({
    after: 15,
    before: 12,
  })
  expect(MeasureTrackedTimeouts.isLeak({ after, before })).toBe(true)
})
