import * as ModeType from '../ModeType/ModeType.js'
import * as Character from '../Character/Character.js'
import * as Ide from '../Ide/Ide.js'
import * as TestRunMode from '../TestRunMode/TestRunMode.js'

const state = {
  buffering: false,
  checkLeaks: false,
  cwd: Character.EmptyString,
  filter: Character.EmptyString,
  headless: false,
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
}

export const setState = (newState) => {
  state.checkLeaks = newState.checkLeaks
  state.cwd = newState.cwd
  state.headless = newState.headless
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
}

const setBuffering = (value) => {
  state.buffering = value
}

const isBuffering = () => {
  return state.buffering
}

const isWatchMode = () => {
  return state.watch
}

const shouldCheckLeaks = () => {
  return state.checkLeaks
}

const getRuns = () => {
  return state.runs
}

export const getState = () => {
  return state
}
