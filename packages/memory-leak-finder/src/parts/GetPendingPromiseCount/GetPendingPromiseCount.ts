import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getPendingPromiseCount = async (session: Session, objectGroup: string): Promise<number> => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Promise,
    returnByValue: false,
    objectGroup,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototype.objectId,
    objectGroup,
  })
  const fnResult2 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: fnResult1.objects.objectId,
    accessorPropertiesOnly: false,
    generatePreview: true,
    nonIndexedPropertiesOnly: false,
    ownProperties: false,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult2.result)
  const previews = descriptors.map((descriptor) => descriptor.preview)
  const properties = previews.map((preview) => preview.properties)
  const promiseStates = properties.map((innerProperties) => {
    const state = innerProperties.find((item) => item.name === '[[PromiseState]]')
    return state.value
  })
  const fulfilled = promiseStates.filter((value) => value === 'fulfilled')
  const fulfilledCount = fulfilled.length
  return fulfilledCount
}
