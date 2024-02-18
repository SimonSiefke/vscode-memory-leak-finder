import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import { DevtoolsProtocolError } from '../DevtoolsProtocolError/DevtoolsProtocolError.js'

export const getDomCounters = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.MemoryGetDomCounters, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}
