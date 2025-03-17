import { CommandNotFoundError } from '../CommandNotFoundError/CommandNotFoundError.js'
import * as ErrorCodes from '../ErrorCodes/ErrorCodes.js'
import * as JsonRpcErrorCode from '../JsonRpcErrorCode/JsonRpcErrorCode.js'
import * as JsonRpcVersion from '../JsonRpcVersion/JsonRpcVersion.js'

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
  return {
    jsonrpc: JsonRpcVersion.Two,
    id: message.id,
    error: {
      code: JsonRpcErrorCode.Custom,
      message: error.message,
      data: {
        stack: error.stack,
        codeFrame: error.codeFrame,
        type: error.type,
        code: error.code,
      },
    },
  }
}
