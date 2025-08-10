import { beforeEach, expect, jest, test } from '@jest/globals'
import * as CliKeys from '../src/parts/CliKeys/CliKeys.ts'
import * as AnsiKeys from '../src/parts/AnsiKeys/AnsiKeys.ts'
import * as ModeType from '../src/parts/ModeType/ModeType.ts'
import * as StdinDataState from '../src/parts/StdinDataState/StdinDataState.ts'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
  return {
    write: jest.fn().mockImplementation(() => Promise.resolve()),
  }
})

jest.unstable_mockModule('../src/parts/IsWindows/IsWindows.ts', () => {
  return {
    isWindows: false,
  }
})

jest.unstable_mockModule('../src/parts/WatchUsage/WatchUsage.ts', () => {
  return {
    clearAndPrint: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/PatternUsage/PatternUsage.ts', () => {
  return {
    clearAndPrint: jest.fn(),
  }
})

// no ansi module mocking needed; worker returns placeholders

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const HandleStdinDataFinishedRunningMode = await import(
  '../src/parts/HandleStdinDataFinishedRunningMode/HandleStdinDataFinishedRunningMode.ts'
)
const WatchUsage = await import('../src/parts/WatchUsage/WatchUsage.ts')
const PatternUsage = await import('../src/parts/PatternUsage/PatternUsage.ts')

// Remove the local createTestState function - we'll use StdinDataState.createDefaultState instead

test('handleStdinDataFinishedRunningMode - show watch mode details', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FinishedRunning }
  const key = CliKeys.WatchMode

  // Set up the mock implementation after import
  // @ts-ignore
  WatchUsage.clearAndPrint.mockResolvedValue('[ansi-clear]\nwatch usage\n')

  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)

  expect(newState.mode).toBe(ModeType.Waiting)
  expect(newState.stdout?.at(-1)).toBe('[ansi-clear]\nwatch usage\n')
  // @ts-ignore
  expect(WatchUsage.clearAndPrint).toHaveBeenCalled()
})

test('handleStdinDataFinishedRunningMode - go to filter mode', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FinishedRunning }
  const key = CliKeys.FilterMode

  // Set up the mock implementation after import
  // @ts-ignore
  PatternUsage.clearAndPrint.mockResolvedValue('[ansi-clear]\npattern usage\n')

  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.FilterWaiting)
  expect(newState.value).toBe('')
  expect(newState.stdout?.at(-1)).toBe('[ansi-clear]\npattern usage\n')
  // @ts-ignore
  expect(PatternUsage.clearAndPrint).toHaveBeenCalled()
})

test('handleStdinDataFinishedRunningMode - quit', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FinishedRunning }
  const key = CliKeys.Quit
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Exit)
  expect(Stdout.write).not.toHaveBeenCalled()
})

test('handleStdinDataFinishedRunningMode - run again', async () => {
  const state = { ...StdinDataState.createDefaultState(), mode: ModeType.FinishedRunning }
  const key = AnsiKeys.Enter
  const newState = await HandleStdinDataFinishedRunningMode.handleStdinDataFinishedRunningMode(state, key)
  expect(newState.mode).toBe(ModeType.Running)
  expect(Stdout.write).not.toHaveBeenCalled()
})
