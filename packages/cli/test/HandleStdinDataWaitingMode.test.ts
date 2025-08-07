import { beforeEach, expect, jest, test } from '@jest/globals'
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
    write: jest.fn().mockImplementation(() => Promise.resolve()),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.js')
const HandleStdinDataWaitingMode = await import('../src/parts/HandleStdinDataWaitingMode/HandleStdinDataWaitingMode.js')

test('handleStdinDataWaitingMode - ctrl + c', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ControlC
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - ctrl + d', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ControlD
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - enter', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.Enter
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('\u001B[2K\u001B[G')
})

test('handleStdinDataWaitingMode - escape', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.Escape
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - toggle headless mode', async () => {
  const state = {
    value: 'abc',
    headless: false,
  }
  const key = 'h'
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toEqual({
    value: 'abc',
    headless: true,
    mode: ModeType.Running,
  })
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - other key', async () => {
  const state = {
    value: 'abc',
  }
  const key = 'd'
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - ctrl + backspace', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ControlBackspace
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.value).toBe('')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(AnsiEscapes.eraseLine + AnsiEscapes.cursorLeft)
})

test('handleStdinDataWaitingMode - backspace', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.Backspace
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.value).toBe('ab')
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - arrow left', async () => {
  const state = {
    value: 'abc',
  }
  const key = AnsiKeys.ArrowLeft
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - run all tests', async () => {
  const state = {
    value: 'abc',
  }
  const key = CliKeys.All
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toEqual({
    value: '',
    mode: ModeType.Running,
  })
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - filter mode', async () => {
  const state = {
    value: 'abc',
  }
  const key = CliKeys.FilterMode
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toEqual({
    value: '',
    mode: ModeType.FilterWaiting,
  })
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(AnsiEscapes.clear + PatternUsage.print())
})
