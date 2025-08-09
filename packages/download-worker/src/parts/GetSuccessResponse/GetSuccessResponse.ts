import * as JsonRpcVersion from '../JsonRpcVersion/JsonRpcVersion.ts'

export const getSuccessResponse = (message: any, result: any): any => {
  if (!message.id) {
    return undefined
  }
  return {
    jsonrpc: JsonRpcVersion.Two,
    id: message.id,
    result: result ?? null,
  }
}
