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
  isBuffering: () => false,
  isGithubActions: () => false,
  isWindows: () => false,
  setBuffering: () => {},
  setTestStateChange: () => {},
}))

jest.unstable_mockModule('../src/parts/TestStateOutput/TestStateOutput.ts', () => {
  return {
    clearPending: jest.fn(() => {
      return ''
    }),
  }
})

jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
  return {
    invoke: jest.fn().mockImplementation((method: any, ...args: any[]) => {
      if (method === 'Stdout.getClear') {
        return '[ansi-clear]'
      }
      if (method === 'Stdout.getHandleTestFailedMessage') {
        return 'test failed\n'
      }
      throw new Error(`unexpected method ${method}`)
    }),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const TestStateOutput = await import('../src/parts/TestStateOutput/TestStateOutput.ts')
const HandleTestFailed = await import('../src/parts/HandleTestFailed/HandleTestFailed.ts')

test.skip('handleTestFailed', async () => {
  const file: string = '/test/e2e/src/sample.close-window.js'
  const relativeDirName: string = 'src'
  const releativeFilePath: string = `src/sample.close-window.js`
  const fileName: string = 'sample.close-window.js'
  const error = {
    codeFrame:
      '\u{1B}[0m \u{1B}[90m 13 |\u{1B}[39m   \u{1B}[36mconst\u{1B}[39m window \u{1B}[33m=\u{1B}[39m \u{1B}[36mawait\u{1B}[39m electronApp\u{1B}[33m.\u{1B}[39mfirstWindow()\u{1B}[0m\n' +
      '\u{1B}[0m \u{1B}[90m 14 |\u{1B}[39m   \u{1B}[36mawait\u{1B}[39m window\u{1B}[33m.\u{1B}[39mclose()\u{1B}[0m\n' +
      '\u{1B}[0m\u{1B}[31m\u{1B}[1m>\u{1B}[22m\u{1B}[39m\u{1B}[90m 15 |\u{1B}[39m   \u{1B}[36mawait\u{1B}[39m expect(electronApp)\u{1B}[33m.\u{1B}[39mtoHaveWindowCount(\u{1B}[35m0\u{1B}[39m)\u{1B}[0m\n' +
      '\u{1B}[0m \u{1B}[90m 16 |\u{1B}[39m   \u{1B}[36m}\u{1B}[39m\n' +
      '\u{1B}[0m \u{1B}[90m 17 |\u{1B}[39m\u{1B}[0m',
    message: 'expected window count to be 0 but was 1',
    stack: '    at Module.test (/test/e2e/src/sample.close-window.js:15:29)',
    type: 'Error',
  }

  await HandleTestFailed.handleTestFailed(file, relativeDirName, releativeFilePath, fileName, error, false)

  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(expect.stringContaining('test failed'))
  expect(TestStateOutput.clearPending).toHaveBeenCalledTimes(1)
})
