import { beforeEach, expect, jest, test } from '@jest/globals'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'
import * as StdinDataState from '../src/parts/StdinDataState/StdinDataState.ts'
import * as StdoutWorker from '../src/parts/StdoutWorker/StdoutWorker.ts'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

const HandleStdinDataWaitingMode = await import('../src/parts/HandleStdinDataWaitingMode/HandleStdinDataWaitingMode.ts')

test('handleStdinDataWaitingMode - ctrl + c', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = AnsiKeys.ControlC
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(newState).toBe(state)
})

test('handleStdinDataWaitingMode - ctrl + d', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = AnsiKeys.ControlD
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(newState).toBe(state)
})

test('handleStdinDataWaitingMode - enter', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
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
  
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Waiting)
})

test('handleStdinDataWaitingMode - filter mode', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.Waiting, value: 'abc' }
  const key = CliKeys.FilterMode
  
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
  
  const newState = await HandleStdinDataWaitingMode.handleStdinDataWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.FilterWaiting)
  expect(newState.value).toBe('')
})
