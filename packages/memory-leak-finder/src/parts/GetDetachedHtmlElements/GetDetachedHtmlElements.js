/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getDetachedHtmlElements = async (session) => {
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
  })
  const value = fnResult.result.value

  return value
}
