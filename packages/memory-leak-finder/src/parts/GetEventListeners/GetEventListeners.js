import * as CleanEventListeners from '../CleanEventListeners/CleanEventListeners.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as GetEventListenersFromMap from '../GetEventListenersFromMap/GetEventListenersFromMap.js'
import * as GetEventListenersOfTargets from '../GetEventListenersOfTargets/GetEventListenersOfTargets.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any[]>}
 */
export const getEventListeners = async (session, objectGroup, scriptMap) => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.EventTarget,
    includeCommandLineAPI: true,
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
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult1)
  const fnResult2 = await GetEventListenersOfTargets.getEventListenersOfTargets(session, descriptors)
  const eventListeners = fnResult2.flatMap(GetEventListenersFromMap.getEventListenersFromMap)
  const cleanEventListeners = CleanEventListeners.cleanEventListeners(eventListeners, scriptMap)
  return cleanEventListeners
}
