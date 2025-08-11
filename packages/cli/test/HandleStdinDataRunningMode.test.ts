import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
  return {
    write: jest.fn().mockImplementation(() => Promise.resolve()),
  }
})

jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'Stdout.getInterruptedMessage') {
        return 'interrupted-message'
      }
      if (method === 'Stdout.getWatchUsageMessage') {
        return 'watch-usage'
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  return {
    invoke: mockRpc.invoke.bind(mockRpc),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const HandleStdinDataRunningMode = await import('../src/parts/HandleStdinDataRunningMode/HandleStdinDataRunningMode.ts')

test('handleStdinDataRunningMode - show watch mode details', async () => {
  const state = {
    value: '',
    mode: ModeType.Running,
    stdout: [],
  }
  const key = 'Enter'
  const newState = await HandleStdinDataRunningMode.handleStdinDataRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Interrupted)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('interrupted-message\nwatch-usage')
})

test('handleStdinDataRunningMode - quit', async () => {
  const state = {
    value: '',
    mode: ModeType.Running,
    stdout: [],
  }
  const key = AnsiKeys.ControlC
  const newState = await HandleStdinDataRunningMode.handleStdinDataRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(newState.stdout).toEqual([])
})
