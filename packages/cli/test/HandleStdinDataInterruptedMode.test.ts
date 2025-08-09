import { beforeEach, expect, jest, test } from '@jest/globals'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.ts'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'

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
    invoke: jest.fn().mockImplementation((method: any, ...args: any[]) => {
      if (method === 'Stdout.getClear') {
        return Promise.resolve('\u001B[2J\u001B[3J\u001B[H')
      }
      if (method === 'Stdout.getPatternUsageMessage') {
        return Promise.resolve('\n\u001B[1mPattern Mode Usage\u001B[22m\n \u001B[2m› Press\u001B[22m Esc \u001B[2mto exit pattern mode.\u001B[22m\n \u001B[2m› Press\u001B[22m Enter \u001B[2mto filter by a regex pattern.\u001B[22m\n\n\u001B[2m pattern ›\u001B[22m ')
      }
      throw new Error(`unexpected method ${method}`)
    }),
  }
})

jest.unstable_mockModule('../src/parts/IsWindows/IsWindows.ts', () => {
  return {
    isWindows: false,
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const HandleStdinDataInterruptedMode = await import('../src/parts/HandleStdinDataInterruptedMode/HandleStdinDataInterruptedMode.ts')

test('HandleStdinDataInterruptedMode - watch mode key', async () => {
  const state = {
    value: '',
    mode: ModeType.Interrupted,
  }
  const key = CliKeys.WatchMode
  const newState = await HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState).toBe(state)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('HandleStdinDataInterruptedMode - go to filter mode', async () => {
  const state = {
    value: '',
    mode: ModeType.Interrupted,
  }
  const key = CliKeys.FilterMode
  const newState = await HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState.mode).toBe(ModeType.FilterWaiting)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\u001B[2J\u001B[3J\u001B[H\n' +
      '\u001B[1mPattern Mode Usage\u001B[22m\n' +
      ' \u001B[2m› Press\u001B[22m Esc \u001B[2mto exit pattern mode.\u001B[22m\n' +
      ' \u001B[2m› Press\u001B[22m Enter \u001B[2mto filter by a regex pattern.\u001B[22m\n' +
      '\n' +
      '\u001B[2m pattern ›\u001B[22m ',
  )
})

test('HandleStdinDataInterruptedMode - quit', async () => {
  const state = {
    value: '',
    mode: ModeType.Interrupted,
  }
  const key = CliKeys.Quit
  const newState = await HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('HandleStdinDataInterruptedMode - run again', async () => {
  const state = {
    value: '',
    mode: ModeType.Interrupted,
  }
  const key = AnsiKeys.Enter
  const newState = await HandleStdinDataInterruptedMode.handleStdinDataInterruptedMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(Stdout.write).not.toHaveBeenCalled()
})
