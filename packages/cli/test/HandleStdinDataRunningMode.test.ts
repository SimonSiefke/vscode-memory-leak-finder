import { beforeEach, expect, jest, test } from '@jest/globals'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

const HandleStdinDataRunningMode = await import('../src/parts/HandleStdinDataRunningMode/HandleStdinDataRunningMode.ts')

test('handleStdinDataRunningMode - show watch mode details', async () => {
  const state = {
    value: '',
    mode: ModeType.Running,
    stdout: [],
  }
  const key = 'Enter'
  const newState = await HandleStdinDataRunningMode.handleStdinDataRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Interrupted)
  expect(newState.stdout).toEqual([
    '\u001B[1m\u001B[31mTest run was interrupted.\u001B[39m\u001B[22m\n\n' +
      '\u001B[1mWatch Usage\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22ma\u001B[2m to run all tests.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mf\u001B[2m to run only failed tests.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mp\u001B[2m to filter tests by a filename regex pattern.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mh\u001B[2m to toggle headless mode.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mq\u001B[2m to quit watch mode.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mEnter\u001B[2m to trigger a test run.\u001B[22m\n',
  ])
})

test('handleStdinDataRunningMode - quit', async () => {
  const state = {
    value: '',
    mode: ModeType.Running,
    stdout: [],
  }
  const key = AnsiKeys.ControlC
  const newState = await HandleStdinDataRunningMode.handleStdinDataRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(newState.stdout).toEqual([])
})
