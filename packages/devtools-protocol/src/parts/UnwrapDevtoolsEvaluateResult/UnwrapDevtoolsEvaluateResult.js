import { DevtoolsProtocolError } from '../DevtoolsProtocolError/DevtoolsProtocolError.js'

export const unwrapResult = (rawResult) => {
  if ('result' in rawResult) {
    rawResult = rawResult.result
  }
  if ('error' in rawResult) {
    if (rawResult.error.message && rawResult.error.data) {
      throw new DevtoolsProtocolError(`${rawResult.error.message}: ${rawResult.error.data}`)
    }
    throw new DevtoolsProtocolError(rawResult.error.message)
  }
  if ('exceptionDetails' in rawResult) {
    throw new DevtoolsProtocolError(rawResult.exceptionDetails.exception.description)
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
    if (rawResult.result.result) {
      return rawResult.result.result
    }
    return rawResult.result
  }
  if (typeof rawResult === 'object' && Object.keys(rawResult).length === 0) {
    return rawResult
  }
  if (typeof rawResult === 'object' && 'objects' in rawResult) {
    return rawResult
  }
  throw new Error(`Failed to unwrap devtools evaluate result`)
}
