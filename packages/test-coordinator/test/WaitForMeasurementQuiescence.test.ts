import { beforeEach, expect, jest, test } from '@jest/globals'

const mockWaitForQuiescence = jest.fn<() => Promise<{ didTimeout: boolean }>>()

jest.unstable_mockModule('../src/parts/TestWorkerWaitForQuiescence/TestWorkerWaitForQuiescence.ts', () => ({
  testWorkerWaitForQuiescence: mockWaitForQuiescence,
}))

const { MeasurementInconclusiveError, waitForMeasurementQuiescence } =
  await import('../src/parts/WaitForMeasurementQuiescence/WaitForMeasurementQuiescence.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('waitForMeasurementQuiescence adds measurement context to an idle result', async () => {
  mockWaitForQuiescence.mockResolvedValue({ didTimeout: false })

  await expect(
    waitForMeasurementQuiescence({
      connectionId: 1,
      iteration: 4,
      rpc: {},
      test: 'editor-auto-close-tag',
    }),
  ).resolves.toEqual({
    didTimeout: false,
    duration: expect.any(Number),
    iteration: 4,
    phase: 'measure',
    test: 'editor-auto-close-tag',
  })
})

test('waitForMeasurementQuiescence marks repeated native timeouts inconclusive', async () => {
  mockWaitForQuiescence.mockRejectedValue(new Error('Measurement is inconclusive after 3 idle callback timeouts'))

  const error = await waitForMeasurementQuiescence({
    connectionId: 1,
    iteration: 4,
    rpc: {},
    test: 'editor-auto-close-tag',
  }).catch((error) => error)

  expect(error).toBeInstanceOf(MeasurementInconclusiveError)
  expect(error).toEqual(
    expect.objectContaining({
      didTimeout: true,
      duration: expect.any(Number),
      iteration: 4,
      phase: 'measure',
      test: 'editor-auto-close-tag',
    }),
  )
})
