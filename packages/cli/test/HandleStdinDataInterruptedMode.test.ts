import { expect, test } from '@jest/globals'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.ts'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'
import * as HandleStdinDataInterruptedMode from '../src/parts/HandleStdinDataInterruptedMode/HandleStdinDataInterruptedMode.ts'
import { createDefaultState } from '../src/parts/CreateDefaultState/CreateDefaultState.ts'

// no mocks required

test('HandleStdinDataInterruptedMode - watch mode key', async () => {
  const state = {
    ...createDefaultState(),
    value: '',
    mode: ModeType.Interrupted,
    stdout: [],
  }
  const key = CliKeys.WatchMode
  const newState = await HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState).toBe(state)
  expect(newState.stdout).toEqual([])
})

test('HandleStdinDataInterruptedMode - go to filter mode', async () => {
  const state = {
    ...createDefaultState(),
    value: '',
    mode: ModeType.Interrupted,
    stdout: [],
  }
  const key = CliKeys.FilterMode
  const newState = await HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState.mode).toBe(ModeType.FilterWaiting)
  expect(newState.stdout).toEqual([
    '\u001B[2J\u001B[3J\u001B[H\n' +
      '\u001B[1mPattern Mode Usage\u001B[22m\n' +
      ' \u001B[2m› Press\u001B[22m Esc \u001B[2mto exit pattern mode.\u001B[22m\n' +
      ' \u001B[2m› Press\u001B[22m Enter \u001B[2mto filter by a regex pattern.\u001B[22m\n' +
      '\n' +
      '\u001B[2m pattern ›\u001B[22m ',
  ])
})

test('HandleStdinDataInterruptedMode - quit', async () => {
  const state = {
    ...createDefaultState(),
    value: '',
    mode: ModeType.Interrupted,
    stdout: [],
  }
  const key = CliKeys.Quit
  const newState = await HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(newState.stdout).toEqual([])
})

test('HandleStdinDataInterruptedMode - run again', async () => {
  const state = {
    ...createDefaultState(),
    value: '',
    mode: ModeType.Interrupted,
    stdout: [],
  }
  const key = AnsiKeys.Enter
  const newState = await HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(newState.stdout).toEqual([])
})
