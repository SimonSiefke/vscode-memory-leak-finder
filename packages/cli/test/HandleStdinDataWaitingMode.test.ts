import { beforeEach, expect, jest, test } from '@jest/globals'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'
import * as StdinDataState from '../src/parts/StdinDataState/StdinDataState.ts'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

// Mock RPC for stdout worker
const mockRpc = {
  invoke: jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<any>>,
}

jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
  return {
    invoke: mockRpc.invoke.bind(mockRpc),
  }
})

const HandleStdinDataWaitingMode = await import('../src/parts/HandleStdinDataWaitingMode/HandleStdinDataWaitingMode.ts')

test('handleStdinDataWaitingMode - ctrl + c', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = AnsiKeys.ControlC
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
})

test('handleStdinDataWaitingMode - ctrl + d', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = AnsiKeys.ControlD
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
})

test('handleStdinDataWaitingMode - enter', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = AnsiKeys.Enter
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
})

test('handleStdinDataWaitingMode - escape', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = AnsiKeys.Escape
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
})

test('handleStdinDataWaitingMode - toggle headless mode', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc', headless: false }
  const key = 'h'
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toEqual({
    ...StdinDataState.createDefaultState(),
    value: 'abc',
    headless: true,
    mode: ModeType.Running,
  })
})

test('handleStdinDataWaitingMode - other key', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = 'd'
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
})

test('handleStdinDataWaitingMode - ctrl + backspace', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = AnsiKeys.ControlBackspace
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.value).toBe('')
})

test('handleStdinDataWaitingMode - backspace', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = AnsiKeys.Backspace
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.value).toBe('ab')
})

test('handleStdinDataWaitingMode - arrow left', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = AnsiKeys.ArrowLeft
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
})

test('handleStdinDataWaitingMode - arrow right', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = AnsiKeys.ArrowRight
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
})

test('handleStdinDataWaitingMode - home', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = AnsiKeys.Home
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
})

test('handleStdinDataWaitingMode - end', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = AnsiKeys.End
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState).toBe(state)
})

test('handleStdinDataWaitingMode - watch mode', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = CliKeys.WatchMode
  
  // Mock the stdout worker to return watch usage message
  mockRpc.invoke.mockResolvedValue('[ansi-clear]\nwatch usage\n')
  
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Waiting)
  expect(mockRpc.invoke).toHaveBeenCalled()
})

test('handleStdinDataWaitingMode - filter mode', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = CliKeys.FilterMode
  
  // Mock the stdout worker to return pattern usage message
  mockRpc.invoke.mockResolvedValue('[ansi-clear]\npattern usage\n')
  
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.FilterWaiting)
  expect(newState.value).toBe('')
  expect(mockRpc.invoke).toHaveBeenCalled()
})
