import * as JsonRpcVersion from '../JsonRpcVersion/JsonRpcVersion.ts'

import type { IpcMessage } from '../Types/Types.ts'

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
