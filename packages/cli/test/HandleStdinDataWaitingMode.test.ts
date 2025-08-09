import { beforeEach, expect, jest, test } from '@jest/globals'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as AnsiEscapes from '../src/parts/AnsiEscapes/AnsiEscapes.ts'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'
import * as PatternUsage from '../src/parts/PatternUsage/PatternUsage.ts'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
  return {
    write: jest.fn().mockImplementation(() => Promise.resolve()),
  }
})

jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
  return {
    invoke: jest.fn().mockImplementation((method: string) => {
      if (method === 'Stdout.getEraseLine') {
        return Promise.resolve('\u001B[2K')
      }
      if (method === 'Stdout.getCursorLeft') {
        return Promise.resolve('\u001B[G')
      }
      if (method === 'Stdout.getClear') {
        return Promise.resolve('\u001B[2J\u001B[3J\u001B[H')
      }
      throw new Error(`unexpected method ${method}`)
    }),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const HandleStdinDataWaitingMode = await import('../src/parts/HandleStdinDataWaitingMode/HandleStdinDataWaitingMode.ts')

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
