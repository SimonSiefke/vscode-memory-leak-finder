import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import { DevtoolsProtocolError } from '../DevtoolsProtocolError/DevtoolsProtocolError.js'

/**
 * @param {any} rpc
 * @param {any} options
 */
export const enable = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.AnimationEnable, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}
