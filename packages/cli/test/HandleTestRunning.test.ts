import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/StdinDataState/StdinDataState.ts', () => ({
  isGithubActions: () => false,
  setTestRunning: () => {},
}))

jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
  return {
    write: jest.fn().mockImplementation(() => Promise.resolve()),
  }
})

jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...args: any[]) => {
      if (method === 'Stdout.getHandleTestRunningMessage') {
        const isFirst = args[3]
        if (isFirst) {
          return '\\n\u001B[0m\u001B[7m\u001B[33m\u001B[1m RUNS \u001B[22m\u001B[39m\u001B[27m\u001B[0m \u001B[2m/test/\u001B[22m\u001B[1mapp.test.js\u001B[22m\n'
        }
        return '\\n\u001B[0m\u001B[7m\u001B[33m\u001B[1m RUNS \u001B[22m\u001B[39m\u001B[27m\u001B[0m \u001B[2m/test/\u001B[22m\u001B[1mapp.test.js\u001B[22m\n'
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  return {
    invoke: mockRpc.invoke.bind(mockRpc),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const HandleTestRunning = await import('../src/parts/HandleTestRunning/HandleTestRunning.ts')

test.skip('handleTestRunning - first', async () => {
  await HandleTestRunning.handleTestRunning('/test/app.test.js', '/test', 'app.test.js', /* isFirst */ true)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\\n\u001B[0m\u001B[7m\u001B[33m\u001B[1m RUNS \u001B[22m\u001B[39m\u001B[27m\u001B[0m \u001B[2m/test/\u001B[22m\u001B[1mapp.test.js\u001B[22m\n',
  )
})

test.skip('handleTestRunning - second', async () => {
  await HandleTestRunning.handleTestRunning('/test/app.test.js', '/test', 'app.test.js', /* isFirst */ false)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\\n' +
      '\u001B[0m\u001B[7m\u001B[33m\u001B[1m RUNS \u001B[22m\u001B[39m\u001B[27m\u001B[0m \u001B[2m/test/\u001B[22m\u001B[1mapp.test.js\u001B[22m\n',
  )
})
