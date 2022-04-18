/**
 *
 * @param {import('@playwright/test').CDPSession} session
 * @returns {Promise<number>}
 */
export const getNumberOfHtmlElements = async (session) => {
  const prototype = await session.send("Runtime.evaluate", {
    expression: "HTMLElement.prototype",
    includeCommandLineAPI: true,
    returnByValue: false,
  });
  const objects = await session.send("Runtime.queryObjects", {
    // @ts-ignore
    prototypeObjectId: prototype.result.objectId,
  });
  const fnResult = await session.send("Runtime.callFunctionOn", {
    functionDeclaration: `function(){
  const objects = this
  return objects.length
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
  });
  const value = fnResult.result.value;

  return value;
};
