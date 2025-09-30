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

jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
  return {
    invoke: jest.fn().mockImplementation((method: any, ...args: any[]) => {
      if (method === 'Stdout.getClear') {
        return '[ansi-clear]'
      }
      if (method === 'Stdout.getHandleTestFailedMessage') {
        return Promise.resolve('test failed\n')
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
    type: 'Error',
    message: 'expected window count to be 0 but was 1',
    stack: '    at Module.test (/test/e2e/src/sample.close-window.js:15:29)',
    codeFrame:
      '\u001B[0m \u001B[90m 13 |\u001B[39m   \u001B[36mconst\u001B[39m window \u001B[33m=\u001B[39m \u001B[36mawait\u001B[39m electronApp\u001B[33m.\u001B[39mfirstWindow()\u001B[0m\n' +
      '\u001B[0m \u001B[90m 14 |\u001B[39m   \u001B[36mawait\u001B[39m window\u001B[33m.\u001B[39mclose()\u001B[0m\n' +
      '\u001B[0m\u001B[31m\u001B[1m>\u001B[22m\u001B[39m\u001B[90m 15 |\u001B[39m   \u001B[36mawait\u001B[39m expect(electronApp)\u001B[33m.\u001B[39mtoHaveWindowCount(\u001B[35m0\u001B[39m)\u001B[0m\n' +
      '\u001B[0m \u001B[90m 16 |\u001B[39m   \u001B[36m}\u001B[39m\n' +
      '\u001B[0m \u001B[90m 17 |\u001B[39m\u001B[0m',
  }

  await HandleTestFailed.handleTestFailed(file, relativeDirName, releativeFilePath, fileName, error, false)

  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(expect.stringContaining('test failed'))
  expect(TestStateOutput.clearPending).toHaveBeenCalledTimes(1)
})
