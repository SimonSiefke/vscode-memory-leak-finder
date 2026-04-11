import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

const mockInvoke = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<string>>
const mockHandleExit = jest.fn().mockImplementation(async () => {})
let watchMode = true

jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
  return {
    write: jest.fn().mockImplementation(async () => {}),
  }
})

jest.unstable_mockModule('../src/parts/StdinDataState/StdinDataState.ts', () => {
  return {
    getState() {},
    isWatchMode() {
      return watchMode
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
const HandleExit = await import('../src/parts/HandleExit/HandleExit.ts')
const HandleTestsFinished = await import('../src/parts/HandleTestsFinished/HandleTestsFinished.ts')

test('handleTestsFinished - no filter value', async () => {
  const expectedMessage = 'tests finished\n'

  mockInvoke.mockResolvedValue(expectedMessage)

  await HandleTestsFinished.handleTestsFinished(2, 1, 0, 0, 0, 3, 3000, '')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(expectedMessage)
  expect(HandleExit.handleExit).toHaveBeenCalledTimes(0)
})

test('handleTestsFinished - with filter value', async () => {
  const expectedMessage = 'tests finished with filter\n'

  mockInvoke.mockResolvedValue(expectedMessage)

  await HandleTestsFinished.handleTestsFinished(2, 1, 0, 0, 0, 3, 3000, 'abc')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(expectedMessage)
  expect(HandleExit.handleExit).toHaveBeenCalledTimes(0)
})

test('handleTestsFinished - with leak', async () => {
  const expectedMessage = 'tests finished with leak\n'

  mockInvoke.mockResolvedValue(expectedMessage)

  await HandleTestsFinished.handleTestsFinished(2, 1, 0, 0, 1, 4, 3000, '')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(expectedMessage)
  expect(HandleExit.handleExit).toHaveBeenCalledTimes(0)
})

test('handleTestsFinished - awaits cleanup outside watch mode', async () => {
  const expectedMessage = 'tests finished outside watch mode\n'

  watchMode = false
  mockInvoke.mockResolvedValue(expectedMessage)

  await HandleTestsFinished.handleTestsFinished(1, 0, 0, 0, 0, 1, 1000, '')

  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(expectedMessage)
  expect(HandleExit.handleExit).toHaveBeenCalledTimes(1)
})
