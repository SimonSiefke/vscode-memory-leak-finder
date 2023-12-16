import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'
import * as SplitLines from '../SplitLines/SplitLines.js'

export const getDetachedDomNodesWithStackTraces = async (session, objectGroup) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Node,
    returnByValue: false,
    objectGroup,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
    objectGroup,
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
    objectId: objects.objects.objectId,
    returnByValue: false,
    objectGroup,
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
  return stackTraceMap.get(detachedNode) || ''
}

const getStackTraces = (detachedNodes, stackTraceMap) => {
  const stackTraces = []
  for(const detachedNode of detachedNodes){
    const stackTrace = getStackTrace(detachedNode, stackTraceMap)
    stackTraces.push(stackTrace)
  }
  return stackTraces
}

const stackTraces = getStackTraces(detachedRoots, globalThis.___domNodeStackTraces)
return stackTraces
}`,
    objectId: fnResult1.objectId,
    returnByValue: true,
    objectGroup,
  })
  const merged = []
  for (let i = 0; i < descriptors.length; i++) {
    const descriptor = descriptors[i]
    const stackTrace = stackTraces[i]
    merged.push({
      ...descriptor,
      stackTrace: SplitLines.splitLines(stackTrace),
    })
  }
  return merged
}
