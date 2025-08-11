import { beforeEach, expect, jest, test } from '@jest/globals'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as AnsiEscapes from '../src/parts/AnsiEscapes/AnsiEscapes.ts'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'
import * as PatternUsage from '../src/parts/PatternUsage/PatternUsage.ts'
import { state } from '../src/parts/TestOutputState/TestOutputState.ts'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

// Stdout is now written in orchestrator, handlers only return state.stdout strings
const HandleStdinDataWaitingMode = await import('../src/parts/HandleStdinDataWaitingMode/HandleStdinDataWaitingMode.ts')

test('handleStdinDataWaitingMode - ctrl + c', async () => {
  const state = {
    value: 'abc',
    stdout: [],
  }
  const key = AnsiKeys.ControlC
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(newState.stdout).toEqual([])
})

test('handleStdinDataWaitingMode - ctrl + d', async () => {
  const state = {
    value: 'abc',
    stdout: [],
  }
  const key = AnsiKeys.ControlD
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(newState.stdout).toEqual([])
})

test('handleStdinDataWaitingMode - enter', async () => {
  const state = {
    value: 'abc',
    stdout: [],
  }
  const key = AnsiKeys.Enter
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(newState.stdout).toEqual(['\u001B[2K\u001B[G'])
})

test('handleStdinDataWaitingMode - escape', async () => {
  const state = {
    value: 'abc',
    stdout: [],
  }
  const key = AnsiKeys.Escape
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
  expect(newState.stdout).toEqual([])
})

test('handleStdinDataWaitingMode - toggle headless mode', async () => {
  const state = {
    value: 'abc',
    headless: false,
    stdout: [],
  }
  const key = 'h'
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toEqual({
    ...state,
    value: 'abc',
    headless: true,
    mode: ModeType.Running,
  })
  expect(newState.stdout).toEqual([])
})

test('handleStdinDataWaitingMode - other key', async () => {
  const state = {
    value: 'abc',
    stdout: [],
  }
  const key = 'd'
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
  expect(newState.stdout).toEqual([])
})

test('handleStdinDataWaitingMode - ctrl + backspace', async () => {
  const state = {
    value: 'abc',
    stdout: [],
  }
  const key = AnsiKeys.ControlBackspace
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.value).toBe('')
  expect(newState.stdout).toEqual([AnsiEscapes.eraseLine + AnsiEscapes.cursorLeft])
})

test('handleStdinDataWaitingMode - backspace', async () => {
  const state = {
    value: 'abc',
    stdout: [],
  }
  const key = AnsiKeys.Backspace
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.value).toBe('ab')
  expect(newState.stdout).toEqual([])
})

test('handleStdinDataWaitingMode - arrow left', async () => {
  const state = {
    value: 'abc',
    stdout: [],
  }
  const key = AnsiKeys.ArrowLeft
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
  expect(newState.stdout).toEqual([])
})

test('handleStdinDataWaitingMode - run all tests', async () => {
  const state = {
    value: 'abc',
    stdout: [],
  }
  const key = CliKeys.All
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toEqual({
    ...state,
    value: '',
    mode: ModeType.Running,
  })
  expect(newState.stdout).toEqual([])
})

test('handleStdinDataWaitingMode - filter mode', async () => {
  const state = {
    value: 'abc',
    stdout: [],
  }
  const key = CliKeys.FilterMode
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toEqual({
    ...state,
    value: '',
    mode: ModeType.FilterWaiting,
    stdout: expect.any(Array),
  })
})
