import * as Character from '../Character/Character.js'
import * as GetErrorConstructor from '../GetErrorConstructor/GetErrorConstructor.js'
import * as JoinLines from '../JoinLines/JoinLines.js'
import { JsonRpcError } from '../JsonRpcError/JsonRpcError.js'
import * as JsonRpcErrorCode from '../JsonRpcErrorCode/JsonRpcErrorCode.js'
import * as SplitLines from '../SplitLines/SplitLines.js'

const constructError = (message, type, name) => {
  const ErrorConstructor = GetErrorConstructor.getErrorConstructor(message, type)
  // @ts-ignore
  if (ErrorConstructor === DOMException && name) {
    return new ErrorConstructor(message, name)
  }
  if (ErrorConstructor === Error) {
    const error = new Error(message)
    if (name && name !== 'VError') {
      error.name = name
    }
    return error
  }
  return new ErrorConstructor(message)
}

const recreateStack = (message, stack) => {
  if (message && !stack.includes(message)) {
    return message + Character.NewLine + stack
  }
  return stack
}

const getErrorType = (error) => {
  if (error && error.type) {
    return error.type
  }
  if (error && error.data && error.data.type) {
    return error.data.type
  }
  return ''
}

export const restoreJsonRpcError = (error) => {
  if (error && error instanceof Error) {
    return error
  }
  if (error && error.code && error.code === JsonRpcErrorCode.MethodNotFound) {
    const restoredError = new JsonRpcError(error.message)
    restoredError.stack = error.stack || error.data || ''
    return restoredError
  }
  if (error && error.message) {
    const type = getErrorType(error)
    const restoredError = constructError(error.message, type, error.name)
    const currentStack = JoinLines.joinLines(SplitLines.splitLines(new Error().stack).slice(1))
    if (error.data) {
      if (error.data.stack && type && error.message) {
        restoredError.stack = type + ': ' + error.message + Character.NewLine + error.data.stack + Character.NewLine + currentStack
      } else if (error.data.stack) {
        restoredError.stack = recreateStack(error.message, error.data.stack) + Character.NewLine + currentStack
      }
      if (error.data.codeFrame) {
        // @ts-ignore
        restoredError.codeFrame = error.data.codeFrame
      }
      if (error.data.code) {
        // @ts-ignore
        restoredError.code = error.data.code
      }
    } else if (error.stack) {
      // @ts-ignore
      restoredError.stack = recreateStack(error.message, error.stack) + Character.NewLine + currentStack
    }
    return restoredError
  }
  if (typeof error === 'string') {
    return new Error(`JsonRpc Error: ${error}`)
  }
  console.log({ error })
  return new Error(`JsonRpc Error: Unknown Error`)
}
