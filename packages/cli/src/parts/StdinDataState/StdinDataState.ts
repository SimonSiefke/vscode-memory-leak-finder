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
  measureNode?: boolean
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
  exitCode: number
  isWindows: boolean
  shouldContinue: boolean
  inspectSharedProcess: boolean
  inspectExtensions: boolean
  inspectPtyHost: boolean
  enableExtensions: boolean
}

let state: StdinDataState = {
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
  exitCode: 0,
  shouldContinue: false,
  inspectSharedProcess: false,
  inspectExtensions: false,
  inspectPtyHost: false,
  enableExtensions: false,
}

export const setState = (newState): void => {
  state = {
    ...state,
    checkLeaks: newState.checkLeaks,
    runSkippedTestsAnyway: newState.runSkippedTestsAnyway,
    cwd: newState.cwd,
    headless: newState.headless,
    isGithubActions: newState.isGithubActions,
    measure: newState.measure,
    mode: newState.mode,
    recordVideo: newState.recordVideo,
    runs: newState.runs,
    value: newState.value,
    watch: newState.watch,
    measureAfter: newState.measureAfter,
    timeouts: newState.timeouts,
    timeoutBetween: newState.timeoutBetween,
    restartBetween: newState.restartBetween,
    runMode: newState.runMode,
    ide: newState.ide,
    ideVersion: newState.ideVersion,
    workers: newState.workers,
    stdout: newState.stdout,
    previousFilters: newState.previousFilters,
    isWindows: newState.isWindows,
    shouldContinue: newState.shouldContinue,
    inspectSharedProcess: newState.inspectSharedProcess,
    inspectExtensions: newState.inspectExtensions,
    inspectPtyHost: newState.inspectPtyHost,
  }
}

export const setBuffering = (value: boolean): void => {
  state = {
    ...state,
    buffering: value,
  }
}

export const setTestSetup = (): void => {
  state = {
    ...state,
    mode: ModeType.Waiting,
  }
}

export const setTestRunning = (): void => {
  state = {
    ...state,
    mode: ModeType.Running,
  }
}

export const setTestStateChange = (): void => {
  state = {
    ...state,
    mode: ModeType.Waiting,
  }
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
