import type { Session } from '../Session/Session.ts'
import * as CleanEventListeners from '../CleanEventListeners/CleanEventListeners.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as GetEventListenersFromMap from '../GetEventListenersFromMap/GetEventListenersFromMap.ts'
import * as GetEventListenersOfTargets from '../GetEventListenersOfTargets/GetEventListenersOfTargets.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getEventListeners = async (session: Session, objectGroup: string, scriptMap: any): Promise<readonly any[]> => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.EventTarget,
    returnByValue: false,
    objectGroup,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototype.objectId,
    objectGroup,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objects.objects.objectId,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult1.result)
  const fnResult2 = await GetEventListenersOfTargets.getEventListenersOfTargets(session, descriptors)
  const eventListeners = fnResult2.flatMap(GetEventListenersFromMap.getEventListenersFromMap)
  const cleanEventListeners = CleanEventListeners.cleanEventListeners(eventListeners, scriptMap)
  return cleanEventListeners
}
