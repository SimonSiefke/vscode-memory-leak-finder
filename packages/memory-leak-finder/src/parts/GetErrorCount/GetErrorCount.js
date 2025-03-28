import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getErrorCount = async (session, objectGroup) => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
    returnByValue: false,
    objectGroup,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototype.objectId,
    objectGroup,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function () {
  const objects = this

  const isError = object => {
    try {
      return object instanceof Error
    } catch {
      return false
    }
  }

  const getErrorCount = objects => {
    const errors = objects.filter(isError)
    const errorCount = errors.length
    return errorCount
  }

  const count = getErrorCount(objects)
  return count
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })
  return fnResult1
}
