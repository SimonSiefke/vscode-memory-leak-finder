import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getErrorCount = async (session: Session, objectGroup: string): Promise<number> => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
    objectGroup,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototype.objectId,
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
    objectGroup,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })
  return fnResult1
}
