import * as GetNewStdinModule from '../GetNewStdinModule/GetNewStdinModule.js'

export const getNewStdinState = (state, key) => {
  const fn = GetNewStdinModule.getFn(state.mode)
  return fn(state, key)
}
