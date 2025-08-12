import { expect, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import { createDefaultState } from '../src/parts/CreateDefaultState/CreateDefaultState.ts'
import * as HandleStdinDataFilterWaitingMode from '../src/parts/HandleStdinDataFilterWaitingMode/HandleStdinDataFilterWaitingMode.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'
import * as StdoutWorker from '../src/parts/StdoutWorker/StdoutWorker.ts'

test('handleStdinDataFilterWaitingMode - alt + backspace', async () => {
  const state = { ...createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.AltBackspace

  const mockRpc = MockRpc.create({
    invoke(method: any) {
      if (method === 'Stdout.getCursorBackward') {
        return Promise.resolve('\u001B[3D')
      }
      if (method === 'Stdout.getEraseEndLine') {
        return Promise.resolve('\u001B[K')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  StdoutWorker.set(mockRpc)
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.value).toBe('')
})

test('handleStdinDataFilterWaitingMode - ctrl + backspace', async () => {
  const state = { ...createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.ControlBackspace

  const mockRpc = MockRpc.create({
    invoke: (method: any) => {
      if (method === 'Stdout.getCursorBackward') {
        return Promise.resolve('\u001B[3D')
      }
      if (method === 'Stdout.getEraseEndLine') {
        return Promise.resolve('\u001B[K')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  StdoutWorker.set(mockRpc)

  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.value).toBe('')
})

test('handleStdinDataFilterWaitingMode - ctrl + backspace - empty value', async () => {
  const state = { ...createDefaultState(), mode: ModeType.FilterWaiting, value: '' }
  const key = AnsiKeys.ControlBackspace
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState).toBe(state)
})

test('handleStdinDataFilterWaitingMode - ctrl + c', async () => {
  const state = { ...createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.ControlC
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
})

test('handleStdinDataFilterWaitingMode - ctrl + d', async () => {
  const state = { ...createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.ControlD
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
})

test('handleStdinDataFilterWaitingMode - enter', async () => {
  const state = { ...createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.Enter

  const mockRpc = MockRpc.create({
    invoke: (method: any) => {
      if (method === 'Stdout.getEraseLine') {
        return Promise.resolve('\u001B[2K')
      }
      if (method === 'Stdout.getCursorLeft') {
        return Promise.resolve('\u001B[G')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  StdoutWorker.set(mockRpc)

  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
})

test('handleStdinDataFilterWaitingMode - escape', async () => {
  const state = { ...createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.Escape

  const mockRpc = MockRpc.create({
    invoke: (method: any) => {
      if (method === 'Stdout.getClear') {
        return Promise.resolve('[ansi-clear]\n')
      }
      if (method === 'Stdout.getWatchUsageMessage') {
        return Promise.resolve('[watch usage]')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  StdoutWorker.set(mockRpc)
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState.mode).toBe(ModeType.Waiting)
})

test('handleStdinDataFilterWaitingMode - home', async () => {
  const state = { ...createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.Home
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState).toBe(state)
})

test('handleStdinDataFilterWaitingMode - end', async () => {
  const state = { ...createDefaultState(), mode: ModeType.FilterWaiting, value: 'abc' }
  const key = AnsiKeys.End
  const newState = await HandleStdinDataFilterWaitingMode.handleStdinDataFilterWaitingMode(state, key)
  expect(newState).toBe(state)
})
