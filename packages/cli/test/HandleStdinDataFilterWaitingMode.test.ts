import { beforeEach, expect, jest, test } from '@jest/globals'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
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

const HandleStdinDataFilterWaitingMode = await import('../src/parts/HandleStdinDataFilterWaitingMode/HandleStdinDataFilterWaitingMode.ts')

test('handleStdinDataFilterWaitingMode - alt + backspace', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.AltBackspace
  
  // Mock the stdout worker to return cursor and erase commands
  mockRpc.invoke.mockResolvedValue('\u001B[3D\u001B[K')
  
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.value).toBe('')
  expect(mockRpc.invoke).toHaveBeenCalled()
})

test('handleStdinDataFilterWaitingMode - ctrl + backspace', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.ControlBackspace
  
  // Mock the stdout worker to return cursor and erase commands
  mockRpc.invoke.mockResolvedValue('\u001B[3D\u001B[K')
  
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.value).toBe('')
  expect(mockRpc.invoke).toHaveBeenCalled()
})

test('handleStdinDataFilterWaitingMode - ctrl + backspace - empty value', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: '' }
  const key = AnsiKeys.ControlBackspace
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState).toBe(state)
  expect(mockRpc.invoke).not.toHaveBeenCalled()
})

test('handleStdinDataFilterWaitingMode - ctrl + c', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.ControlC
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(mockRpc.invoke).not.toHaveBeenCalled()
})

test('handleStdinDataFilterWaitingMode - ctrl + d', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.ControlD
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(mockRpc.invoke).not.toHaveBeenCalled()
})

test('handleStdinDataFilterWaitingMode - enter', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.Enter
  
  // Mock the stdout worker to return clear and cursor commands
  mockRpc.invoke.mockResolvedValue('\u001B[2K\u001B[G')
  
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(mockRpc.invoke).toHaveBeenCalled()
})

test('handleStdinDataFilterWaitingMode - escape', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.Escape
  
  // Mock the stdout worker to return watch usage message
  mockRpc.invoke.mockResolvedValue('[ansi-clear]\nwatch usage\n')
  
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Waiting)
  expect(mockRpc.invoke).toHaveBeenCalled()
})

test('handleStdinDataFilterWaitingMode - home', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.Home
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState).toBe(state)
})

test('handleStdinDataFilterWaitingMode - end', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.End
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState).toBe(state)
})
