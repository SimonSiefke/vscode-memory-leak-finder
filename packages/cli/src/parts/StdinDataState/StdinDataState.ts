import * as Character from '../Character/Character.ts'
import * as Ide from '../Ide/Ide.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as TestRunMode from '../TestRunMode/TestRunMode.ts'

export interface StdinDataState {
  buffering: boolean
  checkLeaks: boolean
  runSkippedTestsAnyway: boolean
  cwd: string
  filter: string
  headless: boolean
  isGithubActions: boolean
  measure: string
  mode: number
  recordVideo: boolean
  runs: number
  value: string
  watch: boolean
  measureAfter: boolean
  timeouts: boolean
  timeoutBetween: number
  restartBetween: boolean
  runMode: number
  ide: string
  ideVersion: string
  workers: boolean
  stdout: string[]
  previousFilters: string[]
  isWindows: boolean
}

export const state: StdinDataState = {
  buffering: false,
  checkLeaks: false,
  runSkippedTestsAnyway: false,
  cwd: Character.EmptyString,
  filter: Character.EmptyString,
  headless: false,
  isGithubActions: false,
  measure: Character.EmptyString,
  mode: ModeType.Waiting,
  recordVideo: false,
  runs: 1,
  value: Character.EmptyString,
  watch: false,
  measureAfter: false,
  timeouts: true,
  timeoutBetween: 0,
  restartBetween: false,
  runMode: TestRunMode.Auto,
  ide: Ide.VsCode,
  ideVersion: Ide.VsCode,
  workers: false,
  stdout: [],
  previousFilters: [],
  isWindows: false,
}

export const setState = (newState): void => {
  state.checkLeaks = newState.checkLeaks
  state.runSkippedTestsAnyway = newState.runSkippedTestsAnyway
  state.cwd = newState.cwd
  state.headless = newState.headless
  state.isGithubActions = newState.isGithubActions
  state.measure = newState.measure
  state.mode = newState.mode
  state.recordVideo = newState.recordVideo
  state.runs = newState.runs
  state.value = newState.value
  state.watch = newState.watch
  state.measureAfter = newState.measureAfter
  state.timeouts = newState.timeouts
  state.timeoutBetween = newState.timeoutBetween
  state.restartBetween = newState.restartBetween
  state.runMode = newState.runMode
  state.ide = newState.ide
  state.ideVersion = newState.ideVersion
  state.workers = newState.workers
  state.stdout = newState.stdout
  state.previousFilters = newState.previousFilters
  state.isWindows = newState.isWindows
}

export const setBuffering = (value: boolean): void => {
  state.buffering = value
}

export const setTestSetup = (): void => {
  state.mode = ModeType.Waiting
}

export const setTestRunning = (): void => {
  state.mode = ModeType.Running
}

export const setTestStateChange = (): void => {
  state.mode = ModeType.Waiting
}

export const isBuffering = (): boolean => {
  return state.buffering
}

export const isWatchMode = (): boolean => {
  return state.watch
}

export const isGithubActions = (): boolean => {
  return state.isGithubActions
}

export const isWindows = (): boolean => {
  return state.isWindows
}

export const shouldCheckLeaks = (): boolean => {
  return state.checkLeaks
}

export const getRuns = (): number => {
  return state.runs
}

export const getState = () => {
  return state
}
