import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as Invoke from '../Invoke/Invoke.js'

export const enable = (session, options = {}) => {
  return Invoke.invoke(session, DevtoolsCommandType.LayerTreeEnable, options)
}

export const disable = (session, options = {}) => {
  return Invoke.invoke(session, DevtoolsCommandType.LayerTreeDisable, options)
}
