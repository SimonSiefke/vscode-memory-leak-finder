/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getNumberOfHtmlElements = async (session) => {
  const prototype = await session.invoke('Runtime.evaluate', {
    expression: 'HTMLElement.prototype',
    includeCommandLineAPI: true,
    returnByValue: false,
  })
  const objects = await session.invoke('Runtime.queryObjects', {
    // @ts-ignore
    prototypeObjectId: prototype.result.objectId,
  })
  const fnResult = await session.invoke('Runtime.callFunctionOn', {
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
