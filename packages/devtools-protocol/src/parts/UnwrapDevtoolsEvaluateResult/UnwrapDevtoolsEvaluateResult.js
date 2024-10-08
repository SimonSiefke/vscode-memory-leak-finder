import { DevtoolsProtocolError } from '../DevtoolsProtocolError/DevtoolsProtocolError.js'
import * as ErrorCodes from '../ErrorCodes/ErrorCodes.js'

const getErrorCode = (rawResult) => {
  if (rawResult && rawResult.error && rawResult.error.code && rawResult.error.code === -32000) {
    return ErrorCodes.E_DEVTOOLS_INTERNAL_ERROR
  }
  return ''
}

export const unwrapResult = (rawResult) => {
  if ('result' in rawResult) {
    rawResult = rawResult.result
  }
  if ('documents' in rawResult || 'usedSize' in rawResult || 'names' in rawResult) {
    return rawResult
  }
  if ('error' in rawResult) {
    const errorCode = getErrorCode(rawResult)
    if (rawResult.error.message && rawResult.error.data) {
      throw new DevtoolsProtocolError(`${rawResult.error.message}: ${rawResult.error.data}`, errorCode)
    }
    throw new DevtoolsProtocolError(rawResult.error.message, errorCode)
  }
  if ('exceptionDetails' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.exceptionDetails.exception.description)
  }
  if (rawResult && rawResult.result && rawResult.result.value) {
    return rawResult.result.value
  }
  if (rawResult && rawResult.result && rawResult.result.result && rawResult.result.result.value) {
    return rawResult.result.result.value
  }
  if (rawResult && rawResult.result && rawResult.result.result && rawResult.result.result.type === 'undefined') {
    return undefined
  }
  if ('result' in rawResult) {
    if ('type' in rawResult.result) {
      switch (rawResult.result.type) {
        case 'number':
        case 'string':
        case 'boolean':
          return rawResult.result.value
        case 'undefined':
          return undefined
        case 'function':
          return rawResult.result
        case 'object':
          if (rawResult.result.subtype === 'null') {
            return null
          }
          return rawResult.result
        default:
          return rawResult
      }
    }
    if (rawResult.result.result && rawResult.result.result) {
      return rawResult.result.result
    }
    if (Object.keys(rawResult).length > 1) {
      return rawResult
    }
    return rawResult.result
  }
  if (typeof rawResult === 'object' && Object.keys(rawResult).length === 0) {
    return rawResult
  }
  if (typeof rawResult === 'object' && 'objects' in rawResult) {
    return rawResult
  }
  if (typeof rawResult === 'object' && 'identifier' in rawResult) {
    return rawResult
  }
  if (typeof rawResult === 'object' && 'listeners' in rawResult) {
    return rawResult
  }
  throw new Error(`Failed to unwrap devtools evaluate result`)
}
