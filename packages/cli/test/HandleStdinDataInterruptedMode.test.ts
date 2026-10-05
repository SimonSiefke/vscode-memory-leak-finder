import { expect, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.ts'
import { createDefaultState } from '../src/parts/CreateDefaultState/CreateDefaultState.ts'
import * as HandleStdinDataInterruptedMode from '../src/parts/HandleStdinDataInterruptedMode/HandleStdinDataInterruptedMode.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'
import * as StdoutWorker from '../src/parts/StdoutWorker/StdoutWorker.ts'

const mockRpc = MockRpc.create({
  commandMap: {},
  invoke: (method: string) => {
    if (method === 'Stdout.getClear') {
      return '\u{1B}[2J\u{1B}[3J\u{1B}[H'
    }
    if (method === 'Stdout.getPatternUsageMessage') {
      return '\n\u{1B}[1mPattern Mode Usage\u{1B}[22m\n \u{1B}[2m› Press\u{1B}[22m Esc \u{1B}[2mto exit pattern mode.\u{1B}[22m\n \u{1B}[2m› Press\u{1B}[22m Enter \u{1B}[2mto filter by a regex pattern.\u{1B}[22m\n\n\u{1B}[2m pattern ›\u{1B}[22m '
    }
    throw new Error(`unexpected method ${method}`)
  },
})

StdoutWorker.set(mockRpc)

test('HandleStdinDataInterruptedMode - watch mode key', async () => {
  const state = {
    ...createDefaultState(),
    mode: ModeType.Interrupted,
    stdout: [],
    value: '',
  }
  const key = CliKeys.WatchMode
  const newState = await HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState).toBe(state)
  expect(newState.stdout).toEqual([])
})

test('HandleStdinDataInterruptedMode - go to filter mode', async () => {
  const state = {
    ...createDefaultState(),
    mode: ModeType.Interrupted,
    stdout: [],
    value: '',
  }
  const key = CliKeys.FilterMode
  const newState = await HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState.mode).toBe(ModeType.FilterWaiting)
  expect(newState.stdout).toEqual([
    '\u{1B}[2J\u{1B}[3J\u{1B}[H\n' +
      '\u{1B}[1mPattern Mode Usage\u{1B}[22m\n' +
      ' \u{1B}[2m› Press\u{1B}[22m Esc \u{1B}[2mto exit pattern mode.\u{1B}[22m\n' +
      ' \u{1B}[2m› Press\u{1B}[22m Enter \u{1B}[2mto filter by a regex pattern.\u{1B}[22m\n' +
      '\n' +
      '\u{1B}[2m pattern ›\u{1B}[22m ',
  ])
})

test('HandleStdinDataInterruptedMode - quit', async () => {
  const state = {
    ...createDefaultState(),
    mode: ModeType.Interrupted,
    stdout: [],
    value: '',
  }
  const key = CliKeys.Quit
  const newState = await HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(newState.stdout).toEqual([])
})

test('HandleStdinDataInterruptedMode - run again', async () => {
  const state = {
    ...createDefaultState(),
    mode: ModeType.Interrupted,
    stdout: [],
    value: '',
  }
  const key = AnsiKeys.Enter
  const newState = await HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(newState.stdout).toEqual([])
})
