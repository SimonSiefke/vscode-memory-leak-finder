import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as Invoke from '../Invoke/Invoke.js'

export const start = (session, options = {}) => {
  return Invoke.invoke(session, DevtoolsCommandType.TracingStart, options)
}

export const end = (session, options = {}) => {
  return Invoke.invoke(session, DevtoolsCommandType.TracingEnd, options)
}
