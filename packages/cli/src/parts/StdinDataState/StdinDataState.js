import * as ModeType from '../ModeType/ModeType.js'

export const state = {
  value: '',
  mode: ModeType.Waiting,
  buffering: false,
}

export const setState = (newState) => {
  state.value = newState.value
  state.mode = newState.mode
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
