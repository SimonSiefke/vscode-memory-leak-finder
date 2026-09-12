import { beforeEach, expect, jest, test } from '@jest/globals'

const mockForceGarbageCollection = jest.fn<(...args: any[]) => Promise<void>>()
const mockGetPromiseCount = jest.fn<(...args: any[]) => Promise<number>>()
const mockReleaseObjectGroup = jest.fn<(...args: any[]) => Promise<void>>()

jest.unstable_mockModule('../src/parts/ForceGarbageCollection/ForceGarbageCollection.ts', () => ({
  forceGarbageCollection: mockForceGarbageCollection,
}))
jest.unstable_mockModule('../src/parts/GetPromiseCount/GetPromiseCount.ts', () => ({
  getPromiseCount: mockGetPromiseCount,
}))
jest.unstable_mockModule('../src/parts/ReleaseObjectGroup/ReleaseObjectGroup.ts', () => ({
  releaseObjectGroup: mockReleaseObjectGroup,
}))

const MeasurePromiseCount = await import('../src/parts/MeasurePromiseCount/MeasurePromiseCount.ts')

beforeEach(() => {
  jest.clearAllMocks()
  mockForceGarbageCollection.mockResolvedValue()
  mockGetPromiseCount.mockResolvedValue(123)
  mockReleaseObjectGroup.mockResolvedValue()
})

test.each(['start', 'stop'] as const)('%s counts promises after garbage collection', async (method) => {
  const calls: string[] = []
  const session = {}
  mockForceGarbageCollection.mockImplementation(async () => {
    calls.push('gc')
  })
  mockGetPromiseCount.mockImplementation(async () => {
    calls.push('count')
    return 123
  })
  mockReleaseObjectGroup.mockImplementation(async () => {
    calls.push('release')
  })

  await expect(MeasurePromiseCount[method](session as any, 'promises')).resolves.toBe(123)

  expect(calls).toEqual(['gc', 'count', 'release'])
  expect(mockForceGarbageCollection).toHaveBeenCalledWith(session)
  expect(mockGetPromiseCount).toHaveBeenCalledWith(session, 'promises')
  expect(mockReleaseObjectGroup).toHaveBeenCalledWith(session, 'promises')
})
