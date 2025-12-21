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
    mode: ModeType.FinishedRunning,
    value: '',
  }
  const key = CliKeys.WatchMode

  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Waiting)
  expect(newState.stdout).toEqual(['[cursor-up][erase-down][watch-usage]'])
})

test('handleStdinDataFinishedRunningMode - go to filter mode', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke(method) {
      switch (method) {
        case 'Stdout.getClear':
          return '[clear]'
        case 'Stdout.getCursorUp':
          return '[cursor-up]'
        case 'Stdout.getEraseDown':
          return '[erase-down]'
        case 'Stdout.getPatternUsageMessage':
          return '[pattern-usage]'
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
    mode: ModeType.FinishedRunning,
    stdout: [],
    value: '',
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
    mode: ModeType.FinishedRunning,
    stdout: [],
    value: '',
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
    mode: ModeType.FinishedRunning,
    stdout: [],
    value: '',
  }
  const key = AnsiKeys.Enter
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
})
