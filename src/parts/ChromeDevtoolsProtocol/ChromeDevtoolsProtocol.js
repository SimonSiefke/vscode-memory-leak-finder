// For more information on chrome devtools protocol, see https://github.com/aslushnikov/getting-started-with-cdp/blob/master/README.md

/**
 *
 * @param {import('@playwright/test').ElectronApplication} child
 * @returns
 */
export const connect = async (child) => {
  const page = await child.firstWindow();
  const session = await page.context().newCDPSession(page);
  return { page, session };
};

/**
 *
 * @param {import('@playwright/test').CDPSession} session
 * @returns {Promise<number>}
 */
export const getHtmlElements = async (session) => {
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

/**
 *
 * @param {import('@playwright/test').CDPSession} session
 * @returns {Promise<number>}
 */
export const getDetachedHtmlElements = async (session) => {
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

const getDetachedNodes = (nodes) => {
  const iter = document.createNodeIterator(
    document.documentElement,
    NodeFilter.SHOW_ALL
  )
  const list = []
  let node
  while ((node = iter.nextNode())) {
    list.push(node)
  }
  const detached = []
  for (const node of nodes) {
    if (list.includes(node)) {
      continue
    }
    try {
      node.nodeType
    } catch (error) {
      continue
    }
    detached.push(node)
  }
  return detached
}

const detachedNodes = getDetachedNodes(objects)
console.log(detachedNodes)
return detachedNodes.length
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
  });
  const value = fnResult.result.value;

  return value;
};
