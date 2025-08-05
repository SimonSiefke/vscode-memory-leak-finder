import { CommandNotFoundError } from '../CommandNotFoundError/CommandNotFoundError.ts'
import * as JsonRpcErrorCode from '../JsonRpcErrorCode/JsonRpcErrorCode.ts'
import * as JsonRpcVersion from '../JsonRpcVersion/JsonRpcVersion.ts'

import type { IpcMessage, ErrorObject } from '../Types/Types.ts'

export const getErrorResponse = async (message: IpcMessage, error: ErrorObject): Promise<IpcMessage> => {
  if (error && error instanceof CommandNotFoundError) {
    return {
      jsonrpc: JsonRpcVersion.Two,
      id: message.id,
      error: {
        code: JsonRpcErrorCode.MethodNotFound,
        message: error.message,
        data: error.stack,
      },
    } as IpcMessage
  }
  const PrettyError = await import('../PrettyError/PrettyError.ts')
  const prettyError = (await PrettyError.prepare(error)) as any
  return {
    jsonrpc: JsonRpcVersion.Two,
    id: message.id,
    error: {
      // @ts-ignore
      code: JsonRpcErrorCode.Custom,
      message: prettyError.message,
      data: {
        stack: prettyError.stack,
        codeFrame: prettyError.codeFrame,
        type: prettyError.type,
        code: prettyError.code,
      },
    },
  } as IpcMessage
}
