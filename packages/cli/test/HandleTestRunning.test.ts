import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/StdinDataState/StdinDataState.ts', () => ({
  isGithubActions: () => true,
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
      if (method === 'Stdout.getGitHubGroupStartMessage') {
        const title = args[0]
        return `::group::${title}\n`
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

test('handleTestRunning - github actions group start', async () => {
  await HandleTestRunning.handleTestRunning('/test/app.test.js', '/test', 'app.test.js', /* isFirst */ true)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('::group::app.test.js\n')
})

test.skip('handleTestRunning - non github actions path still works', async () => {})
