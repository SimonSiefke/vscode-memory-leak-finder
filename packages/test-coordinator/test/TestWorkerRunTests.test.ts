import { beforeEach, expect, jest, test } from '@jest/globals'

const mockTestWorkerRunTest = jest.fn<() => Promise<void>>()

jest.unstable_mockModule('../src/parts/TestWorkerRunTest/TestWorkerRunTest.ts', () => ({
  testWorkerRunTest: mockTestWorkerRunTest,
}))

const { testWorkerRunTests } = await import('../src/parts/TestWorkerRunTests/TestWorkerRunTests.ts')

beforeEach(() => {
  jest.resetAllMocks()
  mockTestWorkerRunTest.mockResolvedValue()
})

test('testWorkerRunTests invokes runCompletion after each measured run', async () => {
  const runCompletion = jest.fn<() => Promise<void>>().mockResolvedValue()

  await testWorkerRunTests({}, 1, '/test.js', true, 1, 'linux', 3, runCompletion)

  expect(mockTestWorkerRunTest).toHaveBeenCalledTimes(3)
  expect(runCompletion).toHaveBeenCalledTimes(3)
})

test('testWorkerRunTests does not invoke runCompletion when no callback is provided', async () => {
  await testWorkerRunTests({}, 1, '/test.js', true, 1, 'linux', 2)

  expect(mockTestWorkerRunTest).toHaveBeenCalledTimes(2)
})
