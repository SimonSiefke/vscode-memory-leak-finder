import { DevtoolsProtocolError } from '../DevtoolsProtocolError/DevtoolsProtocolError.js'

export const unwrapResult = (rawResult) => {
  if ('error' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
  if ('exceptionDetails' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.exceptionDetails.exception.description)
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
        case 'object':
          return rawResult.result
        default:
          return rawResult
      }
    }
    return rawResult.result
  }
  return rawResult
}
