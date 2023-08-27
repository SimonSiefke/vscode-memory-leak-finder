import * as ModeType from '../ModeType/ModeType.js'
import * as Character from '../Character/Character.js'

export const state = {
  value: Character.EmptyString,
  mode: ModeType.Waiting,
  buffering: false,
  headless: false,
  watch: false,
  checkLeaks: false,
  runs: 1,
}

export const setState = (newState) => {
  state.value = newState.value
  state.mode = newState.mode
  state.headless = newState.headless
  state.watch = newState.watch
  state.checkLeaks = newState.checkLeaks
  state.runs = newState.runs
}

export const setBuffering = (value) => {
  state.buffering = value
}

export const isBuffering = () => {
  return state.buffering
}

export const isWatchMode = () => {
  return state.watch
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
