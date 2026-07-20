import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as Invoke from '../Invoke/Invoke.js'

export const enable = (session, options = {}) => {
  return Invoke.invoke(session, DevtoolsCommandType.ProfilerEnable, options)
}

export const start = (session, options = {}) => {
  return Invoke.invoke(session, DevtoolsCommandType.ProfilerStart, options)
}

export const stop = (session, options = {}) => {
  return Invoke.invoke(session, DevtoolsCommandType.ProfilerStop, options)
}

export const disable = (session, options = {}) => {
  return Invoke.invoke(session, DevtoolsCommandType.ProfilerDisable, options)
}
