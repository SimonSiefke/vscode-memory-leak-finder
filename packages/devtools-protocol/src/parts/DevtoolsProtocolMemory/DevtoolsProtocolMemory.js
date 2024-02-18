import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as Invoke from '../Invoke/Invoke.js'

export const getDomCounters = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.MemoryGetDomCounters, options)
}
