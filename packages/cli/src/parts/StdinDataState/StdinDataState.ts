import * as ModeType from '../ModeType/ModeType.ts'
import * as Character from '../Character/Character.ts'
import * as Ide from '../Ide/Ide.ts'
import * as TestRunMode from '../TestRunMode/TestRunMode.ts'

export interface StdinDataState {
  buffering: boolean
  checkLeaks: boolean
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
}

export const state: StdinDataState = {
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
}

export const setState = (newState: Partial<StdinDataState>): void => {
  if (newState.checkLeaks !== undefined) state.checkLeaks = newState.checkLeaks
  if (newState.cwd !== undefined) state.cwd = newState.cwd
  if (newState.headless !== undefined) state.headless = newState.headless
  if (newState.isGithubActions !== undefined) state.isGithubActions = newState.isGithubActions
  if (newState.measure !== undefined) state.measure = newState.measure
  if (newState.mode !== undefined) state.mode = newState.mode
  if (newState.recordVideo !== undefined) state.recordVideo = newState.recordVideo
  if (newState.runs !== undefined) state.runs = newState.runs
  if (newState.value !== undefined) state.value = newState.value
  if (newState.watch !== undefined) state.watch = newState.watch
  if (newState.measureAfter !== undefined) state.measureAfter = newState.measureAfter
  if (newState.timeouts !== undefined) state.timeouts = newState.timeouts
  if (newState.timeoutBetween !== undefined) state.timeoutBetween = newState.timeoutBetween
  if (newState.restartBetween !== undefined) state.restartBetween = newState.restartBetween
  if (newState.runMode !== undefined) state.runMode = newState.runMode
  if (newState.ide !== undefined) state.ide = newState.ide
  if (newState.ideVersion !== undefined) state.ideVersion = newState.ideVersion
  if (newState.workers !== undefined) state.workers = newState.workers
  if (newState.stdout !== undefined) state.stdout = newState.stdout
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

export const createDefaultState = (): StdinDataState => ({
  buffering: false,
  checkLeaks: false,
  cwd: '',
  filter: '',
  headless: false,
  isGithubActions: false,
  measure: '',
  mode: ModeType.Waiting,
  recordVideo: false,
  runs: 1,
  value: '',
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
})
