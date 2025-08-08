import { CommandNotFoundError } from '../CommandNotFoundError/CommandNotFoundError.ts'
import * as JsonRpcErrorCode from '../JsonRpcErrorCode/JsonRpcErrorCode.ts'
import * as JsonRpcVersion from '../JsonRpcVersion/JsonRpcVersion.ts'

export const getErrorResponse = async (message: any, error: any): Promise<any> => {
  if (error && error instanceof CommandNotFoundError) {
    return {
      jsonrpc: JsonRpcVersion.Two,
      id: message.id,
      error: {
        code: JsonRpcErrorCode.MethodNotFound,
        message: error.message,
        data: error.stack,
      },
    }
  }
  const PrettyError = await import('../PrettyError/PrettyError.ts')
  const prettyError = await PrettyError.prepare(error)
  return {
    jsonrpc: JsonRpcVersion.Two,
    id: message.id,
    error: {
      code: JsonRpcErrorCode.Custom,
      message: prettyError.message,
      data: {
        stack: prettyError.stack,
        codeFrame: prettyError.codeFrame,
        type: prettyError.type,
        code: prettyError.code,
      },
    },
  }
}
