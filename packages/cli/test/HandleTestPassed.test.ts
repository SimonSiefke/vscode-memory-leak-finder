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
  isGithubActions: () => true,
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
      if (method === 'Stdout.getClear') {
        return '\u001B[2J\u001B[3J\u001B[H'
      }
      if (method === 'Stdout.getHandleTestPassedMessage') {
        return '[ansi-clear] test passed'
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
  await HandleTestPassed.handleTestPassed('/test/app.test.js', '/test', 'app.test.js', 100, false)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(typeof (Stdout.write as any).mock.calls[0][0]).toBe('string')
  expect(TestStateOutput.clearPending).toHaveBeenCalledTimes(1)
})
