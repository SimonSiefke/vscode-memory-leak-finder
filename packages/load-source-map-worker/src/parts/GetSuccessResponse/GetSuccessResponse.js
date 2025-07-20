import * as JsonRpcVersion from '../JsonRpcVersion/JsonRpcVersion.js'

export const getSuccessResponse = (message, result) => {
  if (!message.id) {
    return undefined
  }
  return {
    jsonrpc: JsonRpcVersion.Two,
    id: message.id,
    result: result ?? null,
  }
}
