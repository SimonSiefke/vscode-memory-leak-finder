import { expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.ts'
import { createDefaultState } from '../src/parts/CreateDefaultState/CreateDefaultState.ts'
import * as HandleStdinDataFinishedRunningMode from '../src/parts/HandleStdinDataFinishedRunningMode/HandleStdinDataFinishedRunningMode.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'
import * as StdoutWorker from '../src/parts/StdoutWorker/StdoutWorker.ts'

const mockInvoke = jest.fn(async () => 'not implemented')

const mockRpc = MockRpc.create({
  commandMap: {},
  invoke: mockInvoke,
})

StdoutWorker.set(mockRpc)

test('handleStdinDataFinishedRunningMode - show watch mode details', async () => {
  const state = {
    ...createDefaultState(),
    value: '',
    mode: ModeType.FinishedRunning,
  }
  const key = CliKeys.WatchMode

  // Mock the stdout worker to return watch usage message
  mockInvoke.mockResolvedValue('[ansi-clear]\nwatch usage\n')

  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)

  expect(newState.mode).toBe(ModeType.Waiting)
  expect(newState.stdout).toEqual(['[ansi-clear]\nwatch usage\n'])
  expect(mockRpc.invoke).toHaveBeenCalled()
})

test('handleStdinDataFinishedRunningMode - go to filter mode', async () => {
  const state = {
    ...createDefaultState(),
    value: '',
    mode: ModeType.FinishedRunning,
    stdout: [],
  }
  const key = CliKeys.FilterMode

  // Mock the stdout worker to return pattern usage message
  mockInvoke.mockResolvedValue('[ansi-clear]\npattern usage\n')

  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.FilterWaiting)
  expect(newState.value).toBe('')
  expect(newState.stdout).toEqual(['[ansi-clear]\npattern usage\n'])
  expect(mockRpc.invoke).toHaveBeenCalled()
})

test('handleStdinDataFinishedRunningMode - quit', async () => {
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
