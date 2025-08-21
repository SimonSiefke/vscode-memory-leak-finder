import { expect, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.ts'
import { createDefaultState } from '../src/parts/CreateDefaultState/CreateDefaultState.ts'
import * as HandleStdinDataFinishedRunningMode from '../src/parts/HandleStdinDataFinishedRunningMode/HandleStdinDataFinishedRunningMode.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'
import * as StdoutWorker from '../src/parts/StdoutWorker/StdoutWorker.ts'

test('handleStdinDataFinishedRunningMode - show watch mode details', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke(method) {
      switch (method) {
        case 'Stdout.getCursorUp':
          return '[cursor-up]'
        case 'Stdout.getEraseDown':
          return '[erase-down]'
        case 'Stdout.getWatchUsageMessage':
          return '[watch-usage]'
        default:
          return 'n/a'
      }
    },
  })

  StdoutWorker.set(mockRpc)

  const state = {
    ...createDefaultState(),
    value: '',
    mode: ModeType.FinishedRunning,
  }
  const key = CliKeys.WatchMode

  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Waiting)
  expect(newState.stdout).toEqual(['[cursor-up][erase-down][watch-usage]'])
})

test.only('handleStdinDataFinishedRunningMode - go to filter mode', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke(method) {
      console.log({ method })
      switch (method) {
        case 'Stdout.getCursorUp':
          return '[cursor-up]'
        case 'Stdout.getPatternUsageMessage':
          return '[pattern-usage]'
        case 'Stdout.getClear':
          return '[clear]'
        case 'Stdout.getEraseDown':
          return '[erase-down]'
        case 'Stdout.getWatchUsageMessage':
          return '[watch-usage]'
        default:
          return 'n/a'
      }
    },
  })

  StdoutWorker.set(mockRpc)
  const state = {
    ...createDefaultState(),
    value: '',
    mode: ModeType.FinishedRunning,
    stdout: [],
  }
  const key = CliKeys.FilterMode

  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.FilterWaiting)
  expect(newState.value).toBe('')
  expect(newState.stdout).toEqual(['[clear][pattern-usage]'])
})

test('handleStdinDataFinishedRunningMode - quit', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke(method) {
      switch (method) {
        case 'Stdout.getCursorUp':
          return '[cursor-up]'
        case 'Stdout.getEraseDown':
          return '[erase-down]'
        case 'Stdout.getWatchUsageMessage':
          return '[watch-usage]'
        default:
          return 'n/a'
      }
    },
  })

  StdoutWorker.set(mockRpc)
  const state = {
    ...createDefaultState(),
    value: '',
    mode: ModeType.FinishedRunning,
    stdout: [],
  }
  const key = CliKeys.Quit
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
})

test('handleStdinDataFinishedRunningMode - run again', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke(method) {
      switch (method) {
        case 'Stdout.getCursorUp':
          return '[cursor-up]'
        case 'Stdout.getEraseDown':
          return '[erase-down]'
        case 'Stdout.getWatchUsageMessage':
          return '[watch-usage]'
        default:
          return 'n/a'
      }
    },
  })

  StdoutWorker.set(mockRpc)
  const state = {
    ...createDefaultState(),
    value: '',
    mode: ModeType.FinishedRunning,
    stdout: [],
  }
  const key = AnsiKeys.Enter
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
})
