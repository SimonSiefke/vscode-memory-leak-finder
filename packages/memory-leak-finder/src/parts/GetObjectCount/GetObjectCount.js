import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

/**
 *
 * @param {any} session
 * @param {string} prototype
 * @returns {Promise<number>}
 */
export const getObjectCount = async (session, prototype) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: prototype,
    includeCommandLineAPI: true,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
const objects = this
return objects.length
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })
  return fnResult1
}
