import * as CommandMap from '../CommandMap/CommandMap.js'

export const execute = (method, ...params) => {
  const fn = CommandMap.getFn(method)
  fn(...params)
}
