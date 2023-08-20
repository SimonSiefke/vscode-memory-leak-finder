import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getNumberOfHtmlElements = async (session) => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: 'HTMLElement.prototype',
    includeCommandLineAPI: true,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototype.result.objectId,
  })
  const fnResult = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const objects = this
  return objects.length
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })
  const value = fnResult.result.value

  return value
}
