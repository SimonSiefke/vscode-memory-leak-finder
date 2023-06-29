import * as ModeType from '../ModeType/ModeType.js'
import * as Character from '../Character/Character.js'

export const state = {
  value: Character.EmptyString,
  mode: ModeType.Waiting,
  buffering: false,
  headless: false,
}

export const setState = (newState) => {
  state.value = newState.value
  state.mode = newState.mode
  state.headless = newState.headless
}

export const setBuffering = (value) => {
  state.buffering = value
}

export const isBuffering = () => {
  return state.buffering
}

export const getState = () => {
  return state
}
