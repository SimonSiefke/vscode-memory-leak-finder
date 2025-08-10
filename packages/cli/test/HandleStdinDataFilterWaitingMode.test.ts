import { beforeEach, expect, jest, test } from '@jest/globals'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'
import * as StdinDataState from '../src/parts/StdinDataState/StdinDataState.ts'
import * as StdoutWorker from '../src/parts/StdoutWorker/StdoutWorker.ts'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

const HandleStdinDataFilterWaitingMode = await import('../src/parts/HandleStdinDataFilterWaitingMode/HandleStdinDataFilterWaitingMode.ts')

test('handleStdinDataFilterWaitingMode - alt + backspace', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.AltBackspace
  
  const mockRpc = {
    invoke: jest.fn().mockImplementation((method: any) => {
      if (method === 'Stdout.getCursorBackward') {
        return Promise.resolve('\u001B[3D')
      }
      if (method === 'Stdout.getEraseEndLine') {
        return Promise.resolve('\u001B[K')
      }
      throw new Error(`unexpected method ${method}`)
    }),
    send: jest.fn(),
    invokeAndTransfer: jest.fn(),
    dispose: jest.fn(),
  } as any
  StdoutWorker.set(mockRpc)
  
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.value).toBe('')
})

test('handleStdinDataFilterWaitingMode - ctrl + backspace', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.ControlBackspace
  
  const mockRpc = {
    invoke: jest.fn().mockImplementation((method: any) => {
      if (method === 'Stdout.getCursorBackward') {
        return Promise.resolve('\u001B[3D')
      }
      if (method === 'Stdout.getEraseEndLine') {
        return Promise.resolve('\u001B[K')
      }
      throw new Error(`unexpected method ${method}`)
    }),
    send: jest.fn(),
    invokeAndTransfer: jest.fn(),
    dispose: jest.fn(),
  } as any
  StdoutWorker.set(mockRpc)
  
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.value).toBe('')
})

test('handleStdinDataFilterWaitingMode - ctrl + backspace - empty value', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: '' }
  const key = AnsiKeys.ControlBackspace
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState).toBe(state)
})

test('handleStdinDataFilterWaitingMode - ctrl + c', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.ControlC
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
})

test('handleStdinDataFilterWaitingMode - ctrl + d', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.ControlD
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
})

test('handleStdinDataFilterWaitingMode - enter', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.Enter
  
  const mockRpc = {
    invoke: jest.fn().mockImplementation((method: any) => {
      if (method === 'Stdout.getEraseLine') {
        return Promise.resolve('\u001B[2K')
      }
      if (method === 'Stdout.getCursorLeft') {
        return Promise.resolve('\u001B[G')
      }
      throw new Error(`unexpected method ${method}`)
    }),
    send: jest.fn(),
    invokeAndTransfer: jest.fn(),
    dispose: jest.fn(),
  } as any
  StdoutWorker.set(mockRpc)
  
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
})

test('handleStdinDataFilterWaitingMode - escape', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.Escape
  
  const mockRpc = {
    invoke: jest.fn().mockImplementation((method: any) => {
      if (method === 'Stdout.getClear') {
        return Promise.resolve('[ansi-clear]\n')
      }
      throw new Error(`unexpected method ${method}`)
    }),
    send: jest.fn(),
    invokeAndTransfer: jest.fn(),
    dispose: jest.fn(),
  } as any
  StdoutWorker.set(mockRpc)
  
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Waiting)
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
