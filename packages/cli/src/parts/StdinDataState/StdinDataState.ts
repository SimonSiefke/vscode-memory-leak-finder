import * as ModeType from '../ModeType/ModeType.ts'
import * as Character from '../Character/Character.ts'
import * as Ide from '../Ide/Ide.ts'
import * as TestRunMode from '../TestRunMode/TestRunMode.ts'

export const state = {
  buffering: false,
  checkLeaks: false,
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

export const shouldCheckLeaks = (): boolean => {
  return state.checkLeaks
}

export const getRuns = (): number => {
  return state.runs
}

export const getState = () => {
  return state
}
