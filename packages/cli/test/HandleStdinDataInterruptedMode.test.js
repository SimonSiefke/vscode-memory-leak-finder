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

jest.unstable_mockModule('../src/parts/IsWindows/IsWindows.js', () => {
  return {
    isWindows: false,
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.js')
const HandleStdinDataInterruptedMode = await import('../src/parts/HandleStdinDataInterruptedMode/HandleStdinDataInterruptedMode.js')

test('HandleStdinDataInterruptedMode - watch mode key', () => {
  const state = {
    value: '',
    mode: ModeType.Interrupted,
  }
  const key = CliKeys.WatchMode
  const newState = HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState).toBe(state)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('HandleStdinDataInterruptedMode - go to filter mode', () => {
  const state = {
    value: '',
    mode: ModeType.Interrupted,
  }
  const key = CliKeys.FilterMode
  const newState = HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState.mode).toBe(ModeType.FilterWaiting)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\u001B[2J\u001B[3J\u001B[H\n' +
      '\u001B[1mPattern Mode Usage\u001B[22m\n' +
      ' \u001B[2m› Press\u001B[22m Esc \u001B[2mto exit pattern mode.\u001B[22m\n' +
      ' \u001B[2m› Press\u001B[22m Enter \u001B[2mto filter by a regex pattern.\u001B[22m\n' +
      '\n' +
      '\u001B[2m pattern ›\u001B[22m '
  )
})

test('HandleStdinDataInterruptedMode - quit', () => {
  const state = {
    value: '',
    mode: ModeType.Interrupted,
  }
  const key = CliKeys.Quit
  const newState = HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('HandleStdinDataInterruptedMode - run again', () => {
  const state = {
    value: '',
    mode: ModeType.Interrupted,
  }
  const key = AnsiKeys.Enter
  const newState = HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(Stdout.write).not.toHaveBeenCalled()
})
