import { expect, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as HandleStdinDataRunningMode from '../src/parts/HandleStdinDataRunningMode/HandleStdinDataRunningMode.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'
import * as StdoutWorker from '../src/parts/StdoutWorker/StdoutWorker.ts'

test('handleStdinDataRunningMode - show watch mode details', async () => {
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
  StdoutWorker.set(mockRpc)

  const state = {
    value: '',
    mode: ModeType.Running,
    stdout: [],
  }
  const key = 'Enter'

  const newState = await HandleStdinDataRunningMode.handleStdinDataRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Interrupted)
  expect(newState.stdout).toEqual(['interrupted-message\nwatch-usage'])
})

test('handleStdinDataRunningMode - quit', async () => {
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
  StdoutWorker.set(mockRpc)

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
