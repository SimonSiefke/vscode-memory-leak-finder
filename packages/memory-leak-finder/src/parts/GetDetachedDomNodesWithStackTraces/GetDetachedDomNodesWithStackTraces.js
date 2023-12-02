import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

export const getDetachedDomNodesWithStackTraces = async (session) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Node,
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
  } catch (error) {
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
    objectId: objects.objects.objectId,
    returnByValue: false,
  })

  const fnResult2 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: fnResult1.objectId,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult2.result)
  const stackTraces = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
const detachedRoots = this

const getStackTrace = (detachedNode, stackTraceMap) => {
  return stackTraceMap.get(detachedNode) || {}
}

const addStackTracesToNodes = (detachedNodes, stackTraceMap) => {
  const stackTrces = []
  for(const detachedNode of detachedNodes){
    const stackTrace = getStackTrace(detached, stackTraceMap)
    stackTraces.push(stackTrace)
  }
  return stackTraces
}

const stackTraces = addStackTracesToNodes(detachedRoots, globalThis.__domNodeStackTraces)
return stackTraces
}`,
    objectId: fnResult1.objectId,
    returnByValue: true,
  })
  return {
    descriptors,
    stackTraces,
  }
}
