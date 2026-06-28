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
    write: jest.fn().mockImplementation(async () => {}),
  }
})

jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...args: any[]) => {
      if (method === 'Stdout.getHandleTestRunningMessage') {
        const isFirst = args[3]
        if (isFirst) {
          return '\u{1B}[0m\u{1B}[7m\u{1B}[33m\u{1B}[1m RUNS \u{1B}[22m\u{1B}[39m\u{1B}[27m\u{1B}[0m \u{1B}[2m/test/\u{1B}[22m\u{1B}[1mapp.test.js\u{1B}[22m\n'
        }
        return '\n\u{1B}[0m\u{1B}[7m\u{1B}[33m\u{1B}[1m RUNS \u{1B}[22m\u{1B}[39m\u{1B}[27m\u{1B}[0m \u{1B}[2m/test/\u{1B}[22m\u{1B}[1mapp.test.js\u{1B}[22m\n'
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
    '\u{1B}[0m\u{1B}[7m\u{1B}[33m\u{1B}[1m RUNS \u{1B}[22m\u{1B}[39m\u{1B}[27m\u{1B}[0m \u{1B}[2m/test/\u{1B}[22m\u{1B}[1mapp.test.js\u{1B}[22m\n',
  )
})

test.skip('handleTestRunning - second', async () => {
  await HandleTestRunning.handleTestRunning('/test/app.test.js', '/test', 'app.test.js', /* isFirst */ false)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\n' +
      '\u{1B}[0m\u{1B}[7m\u{1B}[33m\u{1B}[1m RUNS \u{1B}[22m\u{1B}[39m\u{1B}[27m\u{1B}[0m \u{1B}[2m/test/\u{1B}[22m\u{1B}[1mapp.test.js\u{1B}[22m\n',
  )
})
