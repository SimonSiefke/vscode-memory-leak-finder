import * as Callback from '../Callback/Callback.js'
import * as JsonRpcVersion from '../JsonRpcVersion/JsonRpcVersion.js'

export const create = (method, params) => {
  const { id, promise } = Callback.registerPromise()
  const message = {
    jsonrpc: JsonRpcVersion.Two,
    method,
    params,
    id,
  }
  return {
    message,
    promise,
  }
}
