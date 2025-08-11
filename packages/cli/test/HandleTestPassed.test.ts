import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

const mockWrite: (data: string) => Promise<void> = jest.fn(async (_data: string): Promise<void> => {})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
  return {
    write: mockWrite,
  }
})

jest.unstable_mockModule('../src/parts/StdinDataState/StdinDataState.ts', () => ({
  isGithubActions: () => false,
  setTestStateChange: () => {},
  isBuffering: () => false,
  isWindows: () => false,
  setBuffering: () => {},
}))

jest.unstable_mockModule('../src/parts/TestStateOutput/TestStateOutput.ts', () => {
  return {
    clearPending: jest.fn(() => {
      return ''
    }),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const TestStateOutput = await import('../src/parts/TestStateOutput/TestStateOutput.ts')
const HandleTestPassed = await import('../src/parts/HandleTestPassed/HandleTestPassed.ts')
const GetHandleTestPassedMessage = await import('../src/parts/GetHandleTestPassedMessage/GetHandleTestPassedMessage.ts')
const GetTestClearMessage = await import('../src/parts/GetTestClearMessage/GetTestClearMessage.ts')
const AnsiEscapes = await import('../src/parts/AnsiEscapes/AnsiEscapes.ts')

test('handleTestPassed', async () => {
  const file: string = '/test/app.test.js'
  const relativeDirName: string = '/test'
  const fileName: string = 'app.test.js'
  const durationMs: number = 100
  const isLeak: boolean = false

  await HandleTestPassed.handleTestPassed(file, relativeDirName, fileName, durationMs, isLeak)
  expect(Stdout.write).toHaveBeenCalledTimes(1)

  const baseMessage: string = await GetHandleTestPassedMessage.getHandleTestPassedMessage(
    file,
    relativeDirName,
    fileName,
    durationMs,
    isLeak,
  )
  const clearMessage: string = await GetTestClearMessage.getTestClearMessage()
  const expectedOutput: string = AnsiEscapes.clear(false) + clearMessage + baseMessage

  expect(Stdout.write).toHaveBeenCalledWith(expectedOutput)
  expect(TestStateOutput.clearPending).toHaveBeenCalledTimes(1)
})
