import * as GetNewStdinModule from '../GetNewStdinModule/GetNewStdinModule.ts'

export const getNewStdinState = (state: any, key: string): any => {
  const fn = GetNewStdinModule.getFn(state.mode)
  return fn(state, key)
}
