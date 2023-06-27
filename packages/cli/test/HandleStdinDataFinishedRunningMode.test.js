import { jest } from '@jest/globals'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.js'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.js'
import * as ModeType from '../src/parts/ModeType/ModeType.js'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.js', () => {
  return {
    write: jest.fn(),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.js')
const HandleStdinDataFinishedRunningMode = await import(
  '../src/parts/HandleStdinDataFinishedRunningMode/HandleStdinDataFinishedRunningMode.js'
)

test('handleStdinDataFinishedRunningMode - show watch mode details', () => {
  const state = {
    value: '',
    mode: ModeType.FinishedRunning,
  }
  const key = CliKeys.WatchMode
  const newState = HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Waiting)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\x1B[1A\x1B[J\n' +
      '\x1B[1mWatch Usage\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22ma\x1B[2m to run all tests.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mf\x1B[2m to run only failed tests.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mp\x1B[2m to filter tests by a filename regex pattern.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mq\x1B[2m quit watch mode.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mEnter\x1B[2m to trigger a test run.\x1B[22m\n'
  )
})

test('handleStdinDataFinishedRunningMode - go to filter mode', () => {
  const state = {
    value: '',
    mode: ModeType.FinishedRunning,
  }
  const key = CliKeys.FilterMode
  const newState = HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.FilterWaiting)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\x1B[2J\x1B[3J\x1B[H\n' +
      '\x1B[1mPattern Mode Usage\x1B[22m\n' +
      ' \x1B[2m› Press\x1B[22m Esc \x1B[2mto exit pattern mode.\x1B[22m\n' +
      ' \x1B[2m› Press\x1B[22m Enter \x1B[2mto filter by a regex pattern.\x1B[22m\n' +
      '\n' +
      '\x1B[2m pattern ›\x1B[22m '
  )
})

test('handleStdinDataFinishedRunningMode - quit', () => {
  const state = {
    value: '',
    mode: ModeType.FinishedRunning,
  }
  const key = CliKeys.Quit
  const newState = HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataFinishedRunningMode - run again', () => {
  const state = {
    value: '',
    mode: ModeType.FinishedRunning,
  }
  const key = AnsiKeys.Enter
  const newState = HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(Stdout.write).not.toHaveBeenCalled()
})
