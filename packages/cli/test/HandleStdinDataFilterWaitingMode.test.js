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
const HandleStdinDataFilterWaitingMode = await import('../src/parts/HandleStdinDataFilterWaitingMode/HandleStdinDataFilterWaitingMode.js')

test('handleStdinDataFilterWaitingMode - alt + backspace', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.AltBackspace
  const newState = HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.value).toBe('')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('\x1B[3D\x1B[K')
})

test('handleStdinDataFilterWaitingMode - ctrl + backspace', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ControlBackspace
  const newState = HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.value).toBe('')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('\x1B[3D\x1B[K')
})

test('handleStdinDataFilterWaitingMode - ctrl + backspace - empty value', () => {
  const state = {
    value: '',
  }
  const key = AnsiKeys.ControlBackspace
  const newState = HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState).toBe(state)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataFilterWaitingMode - ctrl + c', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ControlC
  const newState = HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataFilterWaitingMode - ctrl + d', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ControlD
  const newState = HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataFilterWaitingMode - enter', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.Enter
  const newState = HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('\x1B[2K\x1B[G')
})

test('handleStdinDataFilterWaitingMode - escape', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.Escape
  const newState = HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Waiting)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\x1B[2J\x1B[3J\x1B[H\n' +
      '\x1B[1mWatch Usage\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22ma\x1B[2m to run all tests.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mf\x1B[2m to run only failed tests.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mp\x1B[2m to filter tests by a filename regex pattern.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mq\x1B[2m quit watch mode.\x1B[22m\n' +
      '\x1B[2m › Press \x1B[22mEnter\x1B[2m to trigger a test run.\x1B[22m\n'
  )
})

test('handleStdinDataFilterWaitingMode - home', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.Home
  const newState = HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState).toBe(state)
})

test('handleStdinDataFilterWaitingMode - end', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.End
  const newState = HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState).toBe(state)
})
