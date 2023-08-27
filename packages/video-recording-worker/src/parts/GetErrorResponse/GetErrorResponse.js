import { CommandNotFoundError } from '../CommandNotFoundError/CommandNotFoundError.js'
import * as ErrorCodes from '../ErrorCodes/ErrorCodes.js'
import * as JsonRpcErrorCode from '../JsonRpcErrorCode/JsonRpcErrorCode.js'
import * as JsonRpcVersion from '../JsonRpcVersion/JsonRpcVersion.js'
import * as PrintPrettyError from '../PrintPrettyError/PrintPrettyError.js'

const shouldLogError = (error) => {
  if (error && error.code === ErrorCodes.ENOENT) {
    return false
  }
  return true
}

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
  if (!shouldLogError(error)) {
    return {
      jsonrpc: JsonRpcVersion.Two,
      id: message.id,
      error: {
        code: JsonRpcErrorCode.Custom,
        message: `${error}`,
        data: {
          code: error.code,
        },
      },
    }
  }
  const PrettyError = await import('../PrettyError/PrettyError.js')
  const prettyError = await PrettyError.prepare(error)
  PrintPrettyError.printPrettyError(prettyError, `[video-recording-worker] `)
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
