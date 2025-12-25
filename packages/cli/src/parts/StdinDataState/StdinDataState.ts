import * as Character from '../Character/Character.ts'
import * as Ide from '../Ide/Ide.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as TestRunMode from '../TestRunMode/TestRunMode.ts'

export interface StdinDataState {
  readonly bisect: boolean
  readonly buffering: boolean
  readonly checkLeaks: boolean
  readonly continueValue: string
  readonly cwd: string
  readonly enableExtensions: boolean
  readonly enableProxy: boolean
  readonly exitCode: number
  readonly filter: string
  readonly headless: boolean
  readonly ide: string
  readonly ideVersion: string
  readonly insidersCommit: string
  readonly inspectExtensions: boolean
  readonly inspectExtensionsPort: number
  readonly inspectPtyHost: boolean
  readonly inspectPtyHostPort: number
  readonly inspectSharedProcess: boolean
  readonly inspectSharedProcessPort: number
  readonly isGithubActions: boolean
  readonly isWindows: boolean
  readonly measure: string
  readonly measureAfter: boolean
  readonly measureNode?: boolean
  readonly mode: number
  readonly previousFilters: string[]
  readonly recordVideo: boolean
  readonly restartBetween: boolean
  readonly runMode: number
  readonly runs: number
  readonly runSkippedTestsAnyway: boolean
  readonly screencastQuality: number
  readonly stdout: string[]
  readonly timeoutBetween: number
  readonly timeouts: boolean
  readonly useProxyMock: boolean
  readonly value: string
  readonly watch: boolean
  readonly workers: boolean
}

let state: StdinDataState = {
  bisect: false,
  buffering: false,
  checkLeaks: false,
  continueValue: '',
  cwd: Character.EmptyString,
  enableExtensions: false,
  enableProxy: false,
  exitCode: 0,
  filter: Character.EmptyString,
  headless: false,
  ide: Ide.VsCode,
  ideVersion: Ide.VsCode,
  insidersCommit: '',
  inspectExtensions: false,
  inspectExtensionsPort: 5870,
  inspectPtyHost: false,
  inspectPtyHostPort: 5877,
  inspectSharedProcess: false,
  inspectSharedProcessPort: 5879,
  isGithubActions: false,
  isWindows: false,
  measure: Character.EmptyString,
  measureAfter: false,
  mode: ModeType.Waiting,
  previousFilters: [],
  recordVideo: false,
  restartBetween: false,
  runMode: TestRunMode.Auto,
  runs: 1,
  runSkippedTestsAnyway: false,
  screencastQuality: 90,
  stdout: [],
  timeoutBetween: 0,
  timeouts: true,
  useProxyMock: false,
  value: Character.EmptyString,
  watch: false,
  workers: false,
}

export const setState = (newState: StdinDataState): void => {
  state = {
    ...state,
    bisect: newState.bisect,
    checkLeaks: newState.checkLeaks,
    continueValue: newState.continueValue,
    cwd: newState.cwd,
    enableExtensions: newState.enableExtensions,
    enableProxy: newState.enableProxy,
    headless: newState.headless,
    ide: newState.ide,
    ideVersion: newState.ideVersion,
    insidersCommit: newState.insidersCommit,
    inspectExtensions: newState.inspectExtensions,
    inspectExtensionsPort: newState.inspectExtensionsPort,
    inspectPtyHost: newState.inspectPtyHost,
    inspectPtyHostPort: newState.inspectPtyHostPort,
    inspectSharedProcess: newState.inspectSharedProcess,
    inspectSharedProcessPort: newState.inspectSharedProcessPort,
    isGithubActions: newState.isGithubActions,
    isWindows: newState.isWindows,
    measure: newState.measure,
    measureAfter: newState.measureAfter,
    mode: newState.mode,
    previousFilters: newState.previousFilters,
    recordVideo: newState.recordVideo,
    restartBetween: newState.restartBetween,
    runMode: newState.runMode,
    runs: newState.runs,
    runSkippedTestsAnyway: newState.runSkippedTestsAnyway,
    screencastQuality: newState.screencastQuality,
    stdout: newState.stdout,
    timeoutBetween: newState.timeoutBetween,
    timeouts: newState.timeouts,
    useProxyMock: newState.useProxyMock,
    value: newState.value,
    watch: newState.watch,
    workers: newState.workers,
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
