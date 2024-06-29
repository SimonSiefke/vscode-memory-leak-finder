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
