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
globalThis.____objects = this
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })
  const fnResult2 = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(() => {
const objects = globalThis.____objects
delete globalThis.____objects

const getAllEventListeners = (nodes) => {
  const listenerMap = Object.create(null)
  for (const node of nodes) {
    const listeners = getEventListeners(node)
    for (const [key, value] of Object.entries(listeners)) {
      listenerMap[key] ||= []
      listenerMap[key].push(...value)
    }
  }
  return listenerMap
}

const listenerMap = getAllEventListeners([...objects, document, window])
return listenerMap
})()`,
    returnByValue: true,
    objectGroup,
    includeCommandLineAPI: true,
  })
  const value = fnResult2
  return value
}
