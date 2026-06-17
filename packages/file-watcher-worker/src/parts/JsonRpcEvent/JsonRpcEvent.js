import * as JsonRpcVersion from '../JsonRpcVersion/JsonRpcVersion.js'

/**
 * @param {string} method
 * @param {unknown[]} params
 */
export const create = (method, params) => {
  return {
    jsonrpc: JsonRpcVersion.Two,
    method,
    params,
  }
}
