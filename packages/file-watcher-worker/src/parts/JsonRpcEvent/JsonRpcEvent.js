import * as JsonRpcVersion from '../JsonRpcVersion/JsonRpcVersion.js'

export const create = (method, params) => {
  return {
    jsonrpc: JsonRpcVersion.Two,
    method,
    params,
  }
}
