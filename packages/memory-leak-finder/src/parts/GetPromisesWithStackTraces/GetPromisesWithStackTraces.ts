import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getPromisesWithStackTraces = async (session, objectGroup) => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Promise,
    objectGroup,
    returnByValue: false,
  })

  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototype.objectId,
  })

  const result = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `
function () {
const promises = this
const stackTraces = promises.map(promise => {
  const item = globalThis.___promiseStackTraces.get(promise)
  return item || ''
})

return stackTraces
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    accessorPropertiesOnly: false,
    generatePreview: true,
    nonIndexedPropertiesOnly: false,
    objectId: objects.objects.objectId,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult1.result)
  const withStackTraces = descriptors.map((descriptor, index) => {
    return {
      ...descriptor,
      stackTrace: result[index] || '',
    }
  })
  return withStackTraces
}
