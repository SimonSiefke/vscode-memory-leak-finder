import * as CleanEventListeners from '../CleanEventListeners/CleanEventListeners.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptors from '../GetDescriptors/GetDescriptors.js'
import * as GetEventListenersFromMap from '../GetEventListenersFromMap/GetEventListenersFromMap.js'
import * as GetEventListenersOfTargets from '../GetEventListenersOfTargets/GetEventListenersOfTargets.js'

/**
 *
 * @param {import('@playwright/test').CDPSession} session
 * @param {string} objectGroup
 * @param {any} scriptMap
 * @returns {Promise<any[]>}
 */
export const getEventListeners = async (session, objectGroup, scriptMap) => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: 'EventTarget.prototype',
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

  const descriptors = GetDescriptors.getDescriptors(fnResult1)
  const fnResult2 = await GetEventListenersOfTargets.getEventListenersOfTargets(session, descriptors)
  const eventListeners = fnResult2.flatMap(GetEventListenersFromMap.getEventListenersFromMap)
  const cleanEventListeners = CleanEventListeners.cleanEventListeners(eventListeners, scriptMap)
  return cleanEventListeners
}
