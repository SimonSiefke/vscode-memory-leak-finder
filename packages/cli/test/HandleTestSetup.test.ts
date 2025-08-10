import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

// Mock the Stdout module
jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
  return {
    write: jest.fn(),
  }
})

// Note: github actions flag is read via StdinDataState in source; no separate module exists

// Mock the StdoutWorker module
jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'Stdout.getHandleTestSetupMessage') {
        return '\n\u001b[0m\u001b[7m\u001b[33m SETUP \u001b[39m\u001b[27m\u001b[0m\n'
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  return {
    invoke: mockRpc.invoke.bind(mockRpc),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const HandleTestSetup = await import('../src/parts/HandleTestSetup/HandleTestSetup.ts')

test('handleTestSetup - should write setup message when not in GitHub Actions', async () => {
  await HandleTestSetup.handleTestSetup()
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('\n\u001b[0m\u001b[7m\u001b[33m SETUP \u001b[39m\u001b[27m\u001b[0m\n')
})

test('handleTestSetup - should not write anything when in GitHub Actions', async () => {
  jest.resetModules()

  jest.unstable_mockModule('../src/parts/StdinDataState/StdinDataState.ts', () => {
    return {
      isGithubActions: () => true,
      setTestSetup: () => {},
    }
  })

  jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
    return {
      write: jest.fn(),
    }
  })

  jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
    const mockRpc = MockRpc.create({
      commandMap: {},
      invoke: (method: string) => {
        if (method === 'Stdout.getHandleTestSetupMessage') {
          return '\n\u001b[0m\u001b[7m\u001b[33m SETUP \u001b[39m\u001b[27m\u001b[0m\n'
        }
        throw new Error(`unexpected method ${method}`)
      },
    })

    return {
      invoke: mockRpc.invoke.bind(mockRpc),
    }
  })

  const StdoutGH = await import('../src/parts/Stdout/Stdout.ts')
  const HandleTestSetupGH = await import('../src/parts/HandleTestSetup/HandleTestSetup.ts')

  await HandleTestSetupGH.handleTestSetup()
  expect(StdoutGH.write).toHaveBeenCalledTimes(0)
})
