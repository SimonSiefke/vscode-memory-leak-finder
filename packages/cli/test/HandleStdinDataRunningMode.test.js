import { jest } from '@jest/globals'
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

test.only('handleStdinDataRunningMode - show watch mode details', () => {
  const state = {
    value: '',
    mode: ModeType.Running,
  }
  const key = 'Enter'
  const newState = HandleStdinDataRunningMode.handleStdinDataRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Interrupted)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\x1B[1m\x1B[31mTest run was interrupted.\x1B[39m\x1B[22m\n\n' +
      '\x1B[1mWatch Usage\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22ma\x1B[2m to run all tests.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mf\x1B[2m to run only failed tests.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mp\x1B[2m to filter tests by a filename regex pattern.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mq\x1B[2m quit watch mode.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mEnter\x1B[2m to trigger a test run.\x1B[22m\n'
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
