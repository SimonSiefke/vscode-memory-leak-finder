import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'
import { VError } from '../VError/VError.ts'

export const getEventListenerCount = async (session: Session): Promise<number> => {
  try {
    const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
      expression: PrototypeExpression.EventTarget,
      returnByValue: false,
    })
    const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
      prototypeObjectId: prototype.objectId,
    })
    await DevtoolsProtocolRuntime.callFunctionOn(session, {
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
    if (typeof value !== 'number') {
      throw new TypeError(`Event listener count must be of type number`)
    }
    return value
  } catch (error) {
    throw new VError(error, `Failed to get event listener count`)
  }
}
