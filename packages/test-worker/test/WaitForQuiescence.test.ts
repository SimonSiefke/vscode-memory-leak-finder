import { beforeEach, expect, jest, test } from '@jest/globals'

const mockWaitForIdle = jest.fn<() => Promise<{ didTimeout: boolean }>>()

jest.unstable_mockModule('../src/parts/PageObjectState/PageObjectState.ts', () => ({
  getPageObjectContext() {
    return {
      page: {
        waitForIdle: mockWaitForIdle,
      },
    }
  },
}))

const { waitForQuiescence } = await import('../src/parts/WaitForQuiescence/WaitForQuiescence.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('waitForQuiescence accepts a genuine idle period', async () => {
  mockWaitForIdle.mockResolvedValue({ didTimeout: false })

  await expect(waitForQuiescence(1)).resolves.toEqual({
    didTimeout: false,
  })
  expect(mockWaitForIdle).toHaveBeenCalledTimes(1)
})

test('waitForQuiescence retries native timeouts three times', async () => {
  mockWaitForIdle.mockResolvedValue({ didTimeout: true })

  await expect(waitForQuiescence(1)).rejects.toThrow('Measurement is inconclusive after 3 idle callback timeouts')
  expect(mockWaitForIdle).toHaveBeenCalledTimes(3)
})

test('waitForQuiescence accepts a genuine idle period after a retry', async () => {
  mockWaitForIdle
    .mockResolvedValueOnce({ didTimeout: true })
    .mockResolvedValueOnce({ didTimeout: true })
    .mockResolvedValueOnce({ didTimeout: false })

  await expect(waitForQuiescence(1)).resolves.toEqual({
    didTimeout: false,
  })
  expect(mockWaitForIdle).toHaveBeenCalledTimes(3)
})
