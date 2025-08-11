import { beforeEach, expect, jest, test } from '@jest/globals'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.ts'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/IsWindows/IsWindows.ts', () => {
  return {
    isWindows: false,
  }
})

const HandleStdinDataFinishedRunningMode = await import(
  '../src/parts/HandleStdinDataFinishedRunningMode/HandleStdinDataFinishedRunningMode.ts'
)

test('handleStdinDataFinishedRunningMode - show watch mode details', async () => {
  const state = {
    value: '',
    mode: ModeType.FinishedRunning,
    stdout: [],
  }
  const key = CliKeys.WatchMode
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Waiting)
  expect(newState.stdout).toEqual([
    '\u001B[1A\u001B[J\n' +
      '\u001B[1mWatch Usage\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22ma\u001B[2m to run all tests.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mf\u001B[2m to run only failed tests.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mp\u001B[2m to filter tests by a filename regex pattern.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mh\u001B[2m to toggle headless mode.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mq\u001B[2m to quit watch mode.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mEnter\u001B[2m to trigger a test run.\u001B[22m\n',
  ])
})

test('handleStdinDataFinishedRunningMode - go to filter mode', async () => {
  const state = {
    value: '',
    mode: ModeType.FinishedRunning,
    stdout: [],
  }
  const key = CliKeys.FilterMode
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.FilterWaiting)
  expect(newState.stdout).toEqual([
    '\u001B[2J\u001B[3J\u001B[H\n' +
      '\u001B[1mPattern Mode Usage\u001B[22m\n' +
      ' \u001B[2m› Press\u001B[22m Esc \u001B[2mto exit pattern mode.\u001B[22m\n' +
      ' \u001B[2m› Press\u001B[22m Enter \u001B[2mto filter by a regex pattern.\u001B[22m\n' +
      '\n' +
      '\u001B[2m pattern ›\u001B[22m ',
  ])
})

test('handleStdinDataFinishedRunningMode - quit', async () => {
  const state = {
    value: '',
    mode: ModeType.FinishedRunning,
    stdout: [],
  }
  const key = CliKeys.Quit
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(newState.stdout).toEqual([])
})

test('handleStdinDataFinishedRunningMode - run again', async () => {
  const state = {
    value: '',
    mode: ModeType.FinishedRunning,
    stdout: [],
  }
  const key = AnsiKeys.Enter
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(newState.stdout).toEqual([])
})
