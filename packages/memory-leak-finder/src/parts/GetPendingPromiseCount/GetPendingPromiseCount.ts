import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'
export const getPendingPromiseCount = async (session: Session, objectGroup: string): Promise<number> => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Promise,
    objectGroup,
    returnByValue: false,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototype.objectId,
  })
  const fnResult2 = await DevtoolsProtocolRuntime.getProperties(session, {
    accessorPropertiesOnly: false,
    generatePreview: true,
    nonIndexedPropertiesOnly: false,
    objectId: fnResult1.objects.objectId,
    ownProperties: false,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult2.result)
  const previews = descriptors.map((descriptor: Dynamic) => descriptor.preview)
  const properties = previews.map((preview: Dynamic) => preview.properties)
  const promiseStates = properties.map((innerProperties: Dynamic) => {
    const state = innerProperties.find((item: Dynamic) => item.name === '[[PromiseState]]')
    return state.value
  })
  const fulfilled = promiseStates.filter((value: Dynamic) => value === 'fulfilled')
  const fulfilledCount = fulfilled.length
  return fulfilledCount
}
