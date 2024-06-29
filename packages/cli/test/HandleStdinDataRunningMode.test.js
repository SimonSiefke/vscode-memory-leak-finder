import { beforeEach, expect, jest, test } from '@jest/globals'
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
const HandleStdinDataRunningMode = await import('../src/parts/HandleStdinDataRunningMode/HandleStdinDataRunningMode.js')

test('handleStdinDataRunningMode - show watch mode details', () => {
  const state = {
    value: '',
    mode: ModeType.Running,
  }
  const key = 'Enter'
  const newState = HandleStdinDataRunningMode.handleStdinDataRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Interrupted)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\u001B[1m\u001B[31mTest run was interrupted.\u001B[39m\u001B[22m\n\n' +
      '\u001B[1mWatch Usage\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22ma\u001B[2m to run all tests.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mf\u001B[2m to run only failed tests.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mp\u001B[2m to filter tests by a filename regex pattern.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mh\u001B[2m to toggle headless mode.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mq\u001B[2m to quit watch mode.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mEnter\u001B[2m to trigger a test run.\u001B[22m\n',
  )
})

test('handleStdinDataRunningMode - quit', () => {
  const state = {
    value: '',
    mode: ModeType.Running,
  }
  const key = AnsiKeys.ControlC
  const newState = HandleStdinDataRunningMode.handleStdinDataRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})
