import { jest } from '@jest/globals'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.js'
import * as AnsiEscapes from '../src/parts/AnsiEscapes/AnsiEscapes.js'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.js'
import * as ModeType from '../src/parts/ModeType/ModeType.js'
import * as PatternUsage from '../src/parts/PatternUsage/PatternUsage.js'

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
const HandleStdinDataWaitingMode = await import('../src/parts/HandleStdinDataWaitingMode/HandleStdinDataWaitingMode.js')

test('handleStdinDataWaitingMode - ctrl + c', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ControlC
  const newState = HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - ctrl + d', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ControlD
  const newState = HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - enter', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.Enter
  const newState = HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('\u001B[2K\u001B[G')
})

test('handleStdinDataWaitingMode - escape', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.Escape
  const newState = HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - toggle headless mode', () => {
  const state = {
    value: 'abc',
    headless: false,
  }
  const key = 'h'
  const newState = HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toEqual({
    value: 'abc',
    headless: true,
    mode: ModeType.Running,
  })
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - other key', () => {
  const state = {
    value: 'abc',
  }
  const key = 'd'
  const newState = HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - ctrl + backspace', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ControlBackspace
  const newState = HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.value).toBe('')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(AnsiEscapes.eraseLine + AnsiEscapes.cursorLeft)
})

test('handleStdinDataWaitingMode - backspace', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.Backspace
  const newState = HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.value).toBe('ab')
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - arrow left', () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ArrowLeft
  const newState = HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - run all tests', () => {
  const state = {
    value: 'abc',
  }
  const key = CliKeys.All
  const newState = HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toEqual({
    value: '',
    mode: ModeType.Running,
  })
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - filter mode', () => {
  const state = {
    value: 'abc',
  }
  const key = CliKeys.FilterMode
  const newState = HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toEqual({
    value: '',
    mode: ModeType.FilterWaiting,
  })
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(AnsiEscapes.clear + PatternUsage.print())
})
