import VError from 'verror'
import { DevtoolsProtocolRuntime } from '@vscode-memory-leak-finder/devtools-protocol'

/**
 *
 * @param {import('@playwright/test').CDPSession} session
 * @returns {Promise<number>}
 */
export const getEventListenerCount = async (session) => {
  try {
    const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
      expression: 'EventTarget.prototype',
      includeCommandLineAPI: true,
      returnByValue: false,
    })
    const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
      prototypeObjectId: prototype.objectId,
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
})()`,
      returnByValue: true,
      includeCommandLineAPI: true,
    })
    const value = fnResult2
    return value
  } catch (error) {
    throw new VError(error, `Failed to get event listener count`)
  }
}
