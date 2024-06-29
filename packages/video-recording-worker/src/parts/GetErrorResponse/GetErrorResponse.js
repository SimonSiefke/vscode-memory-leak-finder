import { CommandNotFoundError } from '../CommandNotFoundError/CommandNotFoundError.js'
import * as JsonRpcErrorCode from '../JsonRpcErrorCode/JsonRpcErrorCode.js'
import * as JsonRpcVersion from '../JsonRpcVersion/JsonRpcVersion.js'

export const getErrorResponse = async (message, error) => {
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
  const PrettyError = await import('../PrettyError/PrettyError.js')
  const prettyError = await PrettyError.prepare(error)
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
  }
}
