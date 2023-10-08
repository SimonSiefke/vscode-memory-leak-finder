import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<number>}
 */
export const getEventListeners = async (session, objectGroup) => {
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
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
const objects = this

const getAllEventListeners = (nodes) => {
  const listenerMap = Object.create(null)
  for (const node of nodes) {
    const listeners = getEventListeners(node)
    for (const [key, value] of Object.entries(listeners)) {
      listenerMap[key] ||= []
      listenerMap[key].push(value)
    }
  }
  return listenerMap
}

const listenerMap = getAllEventListeners([...objects, document, window])
return listenerMap
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })
  const value = fnResult1
  return value
}
