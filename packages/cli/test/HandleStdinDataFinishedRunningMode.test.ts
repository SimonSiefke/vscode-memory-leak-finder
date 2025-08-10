import { beforeEach, expect, jest, test } from '@jest/globals'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.ts'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'
import * as StdinDataState from '../src/parts/StdinDataState/StdinDataState.ts'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

// Mock RPC for stdout worker
const mockRpc = {
  invoke: jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<any>>,
}

jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
  return {
    invoke: mockRpc.invoke.bind(mockRpc),
  }
})

// no ansi module mocking needed; worker returns placeholders

const HandleStdinDataFinishedRunningMode = await import(
  '../src/parts/HandleStdinDataFinishedRunningMode/HandleStdinDataFinishedRunningMode.ts'
)

test('handleStdinDataFinishedRunningMode - show watch mode details', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FinishedRunning }
  const key = CliKeys.WatchMode

  // Mock the stdout worker to return watch usage message
  mockRpc.invoke.mockResolvedValue('[ansi-clear]\nwatch usage\n')

  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)

  expect(newState.mode).toBe(ModeType.Waiting)
  expect(newState.stdout?.at(-1)).toBe('[ansi-clear]\nwatch usage\n')
  expect(mockRpc.invoke).toHaveBeenCalled()
})

test('handleStdinDataFinishedRunningMode - go to filter mode', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FinishedRunning }
  const key = CliKeys.FilterMode

  // Mock the stdout worker to return pattern usage message
  mockRpc.invoke.mockResolvedValue('[ansi-clear]\npattern usage\n')

  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.FilterWaiting)
  expect(newState.value).toBe('')
  expect(newState.stdout?.at(-1)).toBe('[ansi-clear]\npattern usage\n')
  expect(mockRpc.invoke).toHaveBeenCalled()
})

test('handleStdinDataFinishedRunningMode - quit', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FinishedRunning }
  const key = CliKeys.Quit
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
})

test('handleStdinDataFinishedRunningMode - run again', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FinishedRunning }
  const key = AnsiKeys.Enter
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
})
