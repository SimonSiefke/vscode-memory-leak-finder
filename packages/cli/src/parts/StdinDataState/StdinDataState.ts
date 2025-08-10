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
}

export const setState = (newState) => {
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
}

export const setBuffering = (value: boolean) => {
  state.buffering = value
}

export const setTestSetup = () => {
  state.mode = ModeType.Waiting
}

export const setTestRunning = () => {
  state.mode = ModeType.Running
}

export const setTestStateChange = () => {
  state.mode = ModeType.Waiting
}

export const isBuffering = () => {
  return state.buffering
}

export const isWatchMode = () => {
  return state.watch
}

export const isGithubActions = () => {
  return state.isGithubActions
}

export const shouldCheckLeaks = () => {
  return state.checkLeaks
}

export const getRuns = () => {
  return state.runs
}

export const getState = () => {
  return state
}
