import * as JsonRpcVersion from '../JsonRpcVersion/JsonRpcVersion.js'

import type { IpcMessage } from '../Types/Types.js'

export const getSuccessResponse = (message: IpcMessage, result: unknown): IpcMessage => {
  if (!message.id) {
    return {
      jsonrpc: JsonRpcVersion.Two,
      result: result ?? null,
    }
  }
  return {
    jsonrpc: JsonRpcVersion.Two,
    id: message.id,
    result: result ?? null,
  }
}
