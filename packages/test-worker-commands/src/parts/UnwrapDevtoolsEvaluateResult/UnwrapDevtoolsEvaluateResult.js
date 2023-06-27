export const unwrapResult = (result) => {
  switch (
    result.result.result.type // yes, really
  ) {
    case 'number':
    case 'string':
    case 'boolean':
    case 'object':
      return result.result.result.value
    case 'undefined':
      return undefined
    case 'function':
      return {
        type: 'function',
        objectId: result.result.result.objectId,
      }
    default:
      return result
  }
}
