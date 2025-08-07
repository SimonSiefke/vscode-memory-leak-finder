import * as GetNewStdinModule from '../GetNewStdinModule/GetNewStdinModule.ts'

export const getNewStdinState = (state, key) => {
  const fn = GetNewStdinModule.getFn(state.mode)
  return fn(state, key)
}
