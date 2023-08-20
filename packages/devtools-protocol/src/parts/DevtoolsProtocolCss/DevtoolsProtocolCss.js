import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import { DevtoolsProtocolError } from '../DevtoolsProtocolError/DevtoolsProtocolError.js'

export const addRule = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.CssAddRule, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

export const enable = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.CssEnable, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}

export const disable = async (rpc, options) => {
  const rawResult = await rpc.invoke(DevtoolsCommandType.CssDisable, options)
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
}
