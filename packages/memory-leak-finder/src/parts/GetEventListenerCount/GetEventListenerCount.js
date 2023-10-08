import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'
import { VError } from '../VError/VError.js'
/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getEventListenerCount = async (session) => {
  try {
    const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
      expression: PrototypeExpression.EventTarget,
      includeCommandLineAPI: true,
      returnByValue: false,
    })
    const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
      prototypeObjectId: prototype.objectId,
    })
    const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
      functionDeclaration: `function(){
const objects = this

const getAllEventListeners = (nodes) => {
  const listenerMap = Object.create(null)
  for (const node of nodes) {
    const listeners = getEventListeners(node)
    for (const [key, value] of Object.entries(listeners)) {
      listenerMap[key] ||= 0
      listenerMap[key] += value.length
      listenerMap.z_total ||= 0
      listenerMap.z_total += value.length
    }
  }
  return listenerMap.z_total
}

const listenerMap = getAllEventListeners([...objects, document, window])
return listenerMap
}`,
      objectId: objects.objects.objectId,
      returnByValue: true,
      includeCommandLineAPI: true,
    })

    const value = fnResult1
    if (typeof value !== 'number') {
      throw new Error(`Event listener count must be of type number`)
    }
    return value
  } catch (error) {
    throw new VError(error, `Failed to get event listener count`)
  }
}
