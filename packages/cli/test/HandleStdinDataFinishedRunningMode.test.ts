import { beforeEach, expect, jest, test } from '@jest/globals'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.ts'
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

jest.unstable_mockModule('../src/parts/IsWindows/IsWindows.ts', () => {
  return {
    isWindows: false,
  }
})

jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
  return {
    invoke: jest.fn().mockImplementation((method: any, ...args: any[]) => {
      if (method === 'Stdout.getWatchUsageMessage') {
        return Promise.resolve('watch usage\n')
      }
      if (method === 'Stdout.getPatternUsageMessage') {
        return Promise.resolve('pattern usage\n')
      }
      throw new Error(`unexpected method ${method}`)
    }),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const HandleStdinDataFinishedRunningMode = await import(
  '../src/parts/HandleStdinDataFinishedRunningMode/HandleStdinDataFinishedRunningMode.ts'
)

test('handleStdinDataFinishedRunningMode - show watch mode details', async () => {
  const state = {
    value: '',
    mode: ModeType.FinishedRunning,
  }
  const key = CliKeys.WatchMode
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Waiting)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(expect.stringContaining('watch usage'))
})

test('handleStdinDataFinishedRunningMode - go to filter mode', async () => {
  const state = {
    value: '',
    mode: ModeType.FinishedRunning,
  }
  const key = CliKeys.FilterMode
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.FilterWaiting)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(expect.stringContaining('pattern usage'))
})

test('handleStdinDataFinishedRunningMode - quit', async () => {
  const state = {
    value: '',
    mode: ModeType.FinishedRunning,
  }
  const key = CliKeys.Quit
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataFinishedRunningMode - run again', async () => {
  const state = {
    value: '',
    mode: ModeType.FinishedRunning,
  }
  const key = AnsiKeys.Enter
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(Stdout.write).not.toHaveBeenCalled()
})
