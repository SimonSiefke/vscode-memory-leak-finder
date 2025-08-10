import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
  return {
    write: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/StdinDataState/StdinDataState.ts', () => ({
  isGithubActions: () => false,
  setTestStateChange: () => {},
  isBuffering: () => false,
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
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'Stdout.getHandleTestPassedMessage') {
        return '\r\u001B[K\r\u001B[1A\r\u001B[K\r\u001B[1A\u001B[0m\u001B[7m\u001B[1m\u001B[32m PASS \u001B[39m\u001B[22m\u001B[27m\u001B[0m \u001B[2m/test/\u001B[22m\u001B[1mapp.test.js\u001B[22m (0.100 s)\n'
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  return {
    invoke: mockRpc.invoke.bind(mockRpc),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const TestStateOutput = await import('../src/parts/TestStateOutput/TestStateOutput.ts')
const HandleTestPassed = await import('../src/parts/HandleTestPassed/HandleTestPassed.ts')

test('handleTestPassed', async () => {
  const expectedMessage = 'test passed\n'

  await HandleTestPassed.handleTestPassed('/test/app.test.js', '/test', 'app.test.js', 100, false)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(expectedMessage)
  expect(TestStateOutput.clearPending).toHaveBeenCalledTimes(1)
})
