import { beforeEach, expect, jest, test } from '@jest/globals'
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

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const HandleStdinDataFilterWaitingMode = await import('../src/parts/HandleStdinDataFilterWaitingMode/HandleStdinDataFilterWaitingMode.ts')

test('handleStdinDataFilterWaitingMode - alt + backspace', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.AltBackspace
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.value).toBe('')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('\u001B[3D\u001B[K')
})

test('handleStdinDataFilterWaitingMode - ctrl + backspace', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ControlBackspace
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.value).toBe('')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('\u001B[3D\u001B[K')
})

test('handleStdinDataFilterWaitingMode - ctrl + backspace - empty value', async () => {
  const state = {
    value: '',
  }
  const key = AnsiKeys.ControlBackspace
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState).toBe(state)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataFilterWaitingMode - ctrl + c', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ControlC
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataFilterWaitingMode - ctrl + d', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ControlD
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataFilterWaitingMode - enter', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.Enter
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('\u001B[2K\u001B[G')
})

test('handleStdinDataFilterWaitingMode - escape', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.Escape
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Waiting)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\u001B[2J\u001B[3J\u001B[H\n' +
      '\u001B[1mWatch Usage\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22ma\u001B[2m to run all tests.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mf\u001B[2m to run only failed tests.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mp\u001B[2m to filter tests by a filename regex pattern.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mh\u001B[2m to toggle headless mode.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mq\u001B[2m to quit watch mode.\u001B[22m\n' +
      '\u001B[2m › Press \u001B[22mEnter\u001B[2m to trigger a test run.\u001B[22m\n',
  )
})

test('handleStdinDataFilterWaitingMode - home', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.Home
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState).toBe(state)
})

test('handleStdinDataFilterWaitingMode - end', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.End
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState).toBe(state)
})
