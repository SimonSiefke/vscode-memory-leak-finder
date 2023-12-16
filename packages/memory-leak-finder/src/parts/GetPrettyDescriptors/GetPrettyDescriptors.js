import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'

/**
 *
 * @param {any} session
 * @param {string} prototype
 * @returns {Promise<any>}
 */
export const getDescriptors = async (session, prototype) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: prototype,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
const objects = this

const isDetached = node => {
  try {
    node.nodeType
    return false
  } catch {
    return true
  }
}

const getAllNodes = (root) => {
  const iter = document.createNodeIterator(
    document.documentElement,
    NodeFilter.SHOW_ALL
  )
  const list = []
  let node
  while ((node = iter.nextNode())) {
    list.push(node)
  }
  return list
}

const getDetachedNodes = (nodes) => {
  const list = getAllNodes()
  const detached = []
  for (const node of nodes) {
    if (list.includes(node) || node === document || isDetached(node)) {
      continue
    }
    detached.push(node)
  }
  return detached
}

const getDetachedRoots = detachedNodes => {
  const detachedRoots = []
  for(const detachedNode of detachedNodes){
    if(detachedNodes.includes(detachedNode.parentNode)){
      continue
    }
    detachedRoots.push(detachedNode)
  }
  return detachedRoots
}



const detachedNodes = getDetachedNodes(objects)
const detachedRoots = getDetachedRoots(detachedNodes)


const isTextNode = node => {
  return node instanceof Text
}

const prettifyTextNode = node => {
  return \`#text(\${node.nodeValue})\`
}

const isElementNode = node => {
  return node instanceof HTMLElement
}


const prettifyNode = node => {
  if(isTextNode(node)){
    return prettifyTextNode(node)
  }
  if(isElementNode(node)){
    return prettifyElementNode(node)
  }
  return node
}

const prettyDetachedRoots = detachedRoots.map(prettifyNode)
return prettyDetachedRoots
}`,
    objectId: objects.objects.objectId,
    returnByValue: false,
  })

  const fnResult2 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: fnResult1.objectId,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult2.result)
  return descriptors
}
