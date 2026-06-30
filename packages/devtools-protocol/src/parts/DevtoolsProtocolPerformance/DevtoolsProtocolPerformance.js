import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as Invoke from '../Invoke/Invoke.js'

export const enable = (session, options = {}) => {
  return Invoke.invoke(session, DevtoolsCommandType.PerformanceEnable, options)
}

export const disable = (session, options = {}) => {
  return Invoke.invoke(session, DevtoolsCommandType.PerformanceDisable, options)
}

export const getMetrics = (session, options = {}) => {
  return Invoke.invoke(session, DevtoolsCommandType.PerformanceGetMetrics, options)
}
