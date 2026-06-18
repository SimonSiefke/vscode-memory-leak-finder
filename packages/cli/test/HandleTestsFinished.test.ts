import { beforeEach, expect, jest, test } from '@jest/globals'

const mockInvoke = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<string>>
const mockHandleExit = jest.fn() as jest.MockedFunction<() => Promise<void>>
let isWatchMode = true

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
  isWatchMode = true
  process.exitCode = undefined
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
  return {
    write: jest.fn().mockImplementation(async () => {}),
  }
})

jest.unstable_mockModule('../src/parts/StdinDataState/StdinDataState.ts', () => {
  return {
    getState() {},
    isWatchMode() {
      return isWatchMode
    },
    setState() {},
  }
})

jest.unstable_mockModule('../src/parts/HandleExit/HandleExit.ts', () => {
  return {
    handleExit: mockHandleExit,
  }
})

jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
  return {
    invoke: mockInvoke,
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const HandleTestsFinished = await import('../src/parts/HandleTestsFinished/HandleTestsFinished.ts')

test('handleTestsFinished - no filter value', async () => {
  const expectedMessage = 'tests finished\n'

  mockInvoke.mockResolvedValue(expectedMessage)

  await HandleTestsFinished.handleTestsFinished(2, 1, 0, 0, 0, 3, 3000, '')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(expectedMessage)
})

test('handleTestsFinished - skipped failed exits with error outside watch mode', async () => {
  const expectedMessage = 'tests finished with skipped failure\n'
  isWatchMode = false
  mockInvoke.mockResolvedValue(expectedMessage)
  mockHandleExit.mockResolvedValue()

  await HandleTestsFinished.handleTestsFinished(2, 0, 0, 1, 0, 3, 3000, '')

  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(expectedMessage)
  expect(process.exitCode).toBe(1)
  expect(mockHandleExit).toHaveBeenCalledTimes(1)
})

test('handleTestsFinished - with filter value', async () => {
  const expectedMessage = 'tests finished with filter\n'

  mockInvoke.mockResolvedValue(expectedMessage)

  await HandleTestsFinished.handleTestsFinished(2, 1, 0, 0, 0, 3, 3000, 'abc')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(expectedMessage)
})

test('handleTestsFinished - with leak', async () => {
  const expectedMessage = 'tests finished with leak\n'

  mockInvoke.mockResolvedValue(expectedMessage)

  await HandleTestsFinished.handleTestsFinished(2, 1, 0, 0, 1, 4, 3000, '')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(expectedMessage)
})
