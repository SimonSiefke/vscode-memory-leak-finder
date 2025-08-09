import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/IsGithubActions/IsGithubActions.ts', () => {
  return {
    isGithubActions: false,
  }
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
  return {
    write: jest.fn().mockImplementation(() => Promise.resolve()),
  }
})

jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
  return {
    invoke: jest.fn().mockImplementation((method: string, ...args: any[]) => {
      if (method === 'Stdout.getHandleTestRunningMessage') {
        // Args are: [file, relativeDirName, fileName, isFirst]
        const isFirst = args[3]
        if (isFirst) {
          return Promise.resolve('\n\u001B[0m\u001B[7m\u001B[33m\u001B[1m RUNS \u001B[22m\u001B[39m\u001B[27m\u001B[0m \u001B[2m/test/\u001B[22m\u001B[1mapp.test.js\u001B[22m\n')
        } else {
          return Promise.resolve('\n\u001B[0m\u001B[7m\u001B[33m\u001B[1m RUNS \u001B[22m\u001B[39m\u001B[27m\u001B[0m \u001B[2m/test/\u001B[22m\u001B[1mapp.test.js\u001B[22m\n')
        }
      }
      throw new Error(`unexpected method ${method}`)
    }),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const HandleTestRunning = await import('../src/parts/HandleTestRunning/HandleTestRunning.ts')

test.skip('handleTestRunning - first', () => {
  HandleTestRunning.handleTestRunning('/test/app.test.js', '/test', 'app.test.js', /* isFirst */ true)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\u001B[0m\u001B[7m\u001B[33m\u001B[1m RUNS \u001B[22m\u001B[39m\u001B[27m\u001B[0m \u001B[2m/test/\u001B[22m\u001B[1mapp.test.js\u001B[22m\n',
  )
})

test('handleTestRunning - second', async () => {
  await HandleTestRunning.handleTestRunning('/test/app.test.js', '/test', 'app.test.js', /* isFirst */ false)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\n' +
      '\u001B[0m\u001B[7m\u001B[33m\u001B[1m RUNS \u001B[22m\u001B[39m\u001B[27m\u001B[0m \u001B[2m/test/\u001B[22m\u001B[1mapp.test.js\u001B[22m\n',
  )
})
