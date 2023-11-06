import * as Assert from '../Assert/Assert.js'

export const state = {
  lineCount: 1,
}

export const set = (value) => {
  Assert.number(value)
  state.lineCount = value
}

export const get = () => {
  return state.lineCount
}
