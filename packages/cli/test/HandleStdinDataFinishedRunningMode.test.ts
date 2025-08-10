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
        return Promise.resolve(
          '\n\u001B[1mWatch Usage\u001B[22m\n\u001B[2m › Press \u001B[22ma\u001B[2m to run all tests.\u001B[22m\n\u001B[2m › Press \u001B[22mf\u001B[2m to run only failed tests.\u001B[22m\n\u001B[2m › Press \u001B[22mp\u001B[2m to filter tests by a filename regex pattern.\u001B[22m\n\u001B[2m › Press \u001B[22mh\u001B[2m to toggle headless mode.\u001B[22m\n\u001B[2m › Press \u001B[22mq\u001B[2m to quit watch mode.\u001B[22m\n\u001B[2m › Press \u001B[22mEnter\u001B[2m to trigger a test run.\u001B[22m\n',
        )
      }
      if (method === 'Stdout.getPatternUsageMessage') {
        return Promise.resolve(
          '\u001B[1mPattern Mode Usage\u001B[22m\n' +
            ' \u001B[2m› Press\u001B[22m Esc \u001B[2mto exit pattern mode.\u001B[22m\n' +
            ' \u001B[2m› Press\u001B[22m Enter \u001B[2mto filter by a regex pattern.\u001B[22m\n' +
            '\n' +
            '\u001B[2m pattern ›\u001B[22m ',
        )
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
  expect(Stdout.write).toHaveBeenCalledWith(
    '\u001B[1A\u001B[J\n' +
      '\u001B[1mWatch Usage\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22ma\u001B[2m to run all tests.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mf\u001B[2m to run only failed tests.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mp\u001B[2m to filter tests by a filename regex pattern.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mh\u001B[2m to toggle headless mode.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mq\u001B[2m to quit watch mode.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mEnter\u001B[2m to trigger a test run.\u001B[22m\n',
  )
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
  expect(Stdout.write).toHaveBeenCalledWith(
    '\u001B[2J\u001B[3J\u001B[H' +
      '\u001B[1mPattern Mode Usage\u001B[22m\n' +
      ' \u001B[2m› Press\u001B[22m Esc \u001B[2mto exit pattern mode.\u001B[22m\n' +
      ' \u001B[2m› Press\u001B[22m Enter \u001B[2mto filter by a regex pattern.\u001B[22m\n' +
      '\n' +
      '\u001B[2m pattern ›\u001B[22m ',
  )
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
