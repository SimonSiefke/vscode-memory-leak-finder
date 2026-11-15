import { beforeEach, expect, jest, test } from '@jest/globals'

const mockImportTest = jest.fn() as any
const mockBeforeSetup = jest.fn() as any
const mockSetup = jest.fn() as any

jest.unstable_mockModule('../src/parts/ImportTest/ImportTest.ts', () => ({
  importTest: mockImportTest,
}))

jest.unstable_mockModule('../src/parts/TestStage/TestStage.ts', () => ({
  beforeSetup: mockBeforeSetup,
  setup: mockSetup,
}))

const SetupTestWithCallback = await import('../src/parts/SetupTestWithCallback/SetupTestWithCallback.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test.each([false, true])('setupTestWithCallback skips skipInCi tests on GitHub Actions with forceRun=%s', async (forceRun) => {
  mockImportTest.mockResolvedValue({ skip: 1, skipInCi: true })

  const result = await SetupTestWithCallback.setupTestWithCallback(
    {},
    '/test/terminal-editor-move-to-new-window.ts',
    forceRun,
    true,
    false,
    false,
  )

  expect(result).toEqual({ error: null, skipped: true, wasOriginallySkipped: true })
  expect(mockBeforeSetup).not.toHaveBeenCalled()
  expect(mockSetup).not.toHaveBeenCalled()
})

test.each([false, true])('setupTestWithCallback respects local forceRun=%s for skipInCi tests', async (forceRun) => {
  mockImportTest.mockResolvedValue({ skip: 1, skipInCi: true })

  const result = await SetupTestWithCallback.setupTestWithCallback(
    {},
    '/test/terminal-editor-move-to-new-window.ts',
    forceRun,
    false,
    false,
    false,
  )

  expect(result).toEqual({ error: null, skipped: !forceRun, wasOriginallySkipped: true })
  expect(mockBeforeSetup).toHaveBeenCalledTimes(forceRun ? 1 : 0)
  expect(mockSetup).toHaveBeenCalledTimes(forceRun ? 1 : 0)
})

test('setupTestWithCallback skips requiresNetwork tests on GitHub Actions even when skipped tests are forced', async () => {
  mockImportTest.mockResolvedValue({
    requiresNetwork: true,
  })

  const result = await SetupTestWithCallback.setupTestWithCallback({}, '/test/base-five-minutes.ts', true, true, false, false)

  expect(result).toEqual({
    error: null,
    skipped: true,
    wasOriginallySkipped: false,
  })
  expect(mockBeforeSetup).not.toHaveBeenCalled()
  expect(mockSetup).not.toHaveBeenCalled()
})

test('setupTestWithCallback runs requiresNetwork tests on GitHub Actions when network tests are forced', async () => {
  mockImportTest.mockResolvedValue({
    requiresNetwork: true,
  })

  const result = await SetupTestWithCallback.setupTestWithCallback({}, '/test/base-five-minutes.ts', true, true, false, true)

  expect(result).toEqual({
    error: null,
    skipped: false,
    wasOriginallySkipped: false,
  })
  expect(mockBeforeSetup).toHaveBeenCalledTimes(1)
  expect(mockSetup).toHaveBeenCalledTimes(1)
})
