import { beforeEach, expect, jest, test } from '@jest/globals'

const mockGetObjectCount = jest.fn<(...args: any[]) => Promise<number>>()

jest.unstable_mockModule('../src/parts/GetObjectCount/GetObjectCount.ts', () => ({
  getObjectCount: mockGetObjectCount,
}))

const GetFinalizationRegistryCount = await import('../src/parts/GetFinalizationRegistryCount/GetFinalizationRegistryCount.ts')

beforeEach(() => {
  jest.clearAllMocks()
  mockGetObjectCount.mockResolvedValue(3)
})

test('counts objects with the FinalizationRegistry prototype', async () => {
  const session = {}

  await expect(GetFinalizationRegistryCount.getFinalizationRegistryCount(session as any)).resolves.toBe(3)
  expect(mockGetObjectCount).toHaveBeenCalledWith(session, 'FinalizationRegistry.prototype')
})
