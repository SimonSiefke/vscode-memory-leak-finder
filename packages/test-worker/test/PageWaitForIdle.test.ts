import { beforeEach, expect, jest, test } from '@jest/globals'

const mockEvaluate = jest.fn<(_options: unknown) => Promise<boolean>>()

jest.unstable_mockModule('../src/parts/PageObjectState/PageObjectState.ts', () => ({
  getPageObjectContext() {
    return {
      utilityContext: {
        evaluate: mockEvaluate,
      },
    }
  },
}))

const PageWaitForIdle = await import('../src/parts/PageWaitForIdle/PageWaitForIdle.ts')

beforeEach(() => {
  jest.clearAllMocks()
  PageWaitForIdle.resetIdleTimeoutWarning()
})

test('waitForIdle returns a genuine idle callback result', async () => {
  mockEvaluate.mockResolvedValue(false)

  await expect(PageWaitForIdle.waitForIdle({}, true, 90_000)).resolves.toEqual({
    didTimeout: false,
  })
  expect(mockEvaluate).toHaveBeenCalledWith(
    expect.objectContaining({
      expression: expect.stringContaining('requestIdleCallback(callback, { timeout: 1000 })'),
    }),
  )
})

test('waitForIdle reports a native idle callback timeout', async () => {
  mockEvaluate.mockResolvedValue(true)
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

  await expect(PageWaitForIdle.waitForIdle({}, true, 90_000)).resolves.toEqual({
    didTimeout: true,
  })
  warn.mockRestore()
})

test('waitForIdle fails when the renderer transport never settles', async () => {
  jest.useFakeTimers()
  mockEvaluate.mockReturnValue(new Promise(() => {}))

  const promise = PageWaitForIdle.waitForIdle({}, true, 90_000)
  const expectation = expect(promise).rejects.toThrow('Failed to check that page is idle')
  await jest.advanceTimersByTimeAsync(5000)

  await expectation
  jest.useRealTimers()
})

test('repeated native timeouts settle and only warn once per test', async () => {
  mockEvaluate.mockResolvedValue(true)
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

  await expect(Promise.all(Array.from({ length: 10 }, () => PageWaitForIdle.waitForIdle({}, true, 90_000)))).resolves.toHaveLength(10)
  expect(warn).toHaveBeenCalledTimes(1)

  warn.mockRestore()
})

test('timer fallback is a successful scheduler yield', async () => {
  mockEvaluate.mockResolvedValue(false)

  await expect(PageWaitForIdle.waitForIdle({}, false, 90_000)).resolves.toEqual({
    didTimeout: false,
  })
  expect(mockEvaluate).toHaveBeenCalledWith(
    expect.objectContaining({
      expression: expect.stringContaining('setTimeout(() => resolve(false), 16)'),
    }),
  )
})
