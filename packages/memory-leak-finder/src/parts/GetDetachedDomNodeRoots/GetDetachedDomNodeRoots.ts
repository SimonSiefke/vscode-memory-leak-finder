import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getDetachedDomNodeRoots = async (session, objectGroup) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Node,
    objectGroup,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
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
return detachedRoots
}`,
    objectGroup,
    objectId: objects.objects.objectId,
    returnByValue: false,
  })
  return fnResult1
}
