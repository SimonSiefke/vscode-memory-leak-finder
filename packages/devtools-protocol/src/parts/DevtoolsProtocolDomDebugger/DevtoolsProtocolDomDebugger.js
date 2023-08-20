import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as Invoke from '../Invoke/Invoke.js'

export const getEventListeners = async (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.DomDebuggerGetEventListeners, options)
}
