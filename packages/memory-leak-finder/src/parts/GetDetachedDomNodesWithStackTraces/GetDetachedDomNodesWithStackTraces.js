import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as GetDetachedDomNodeRoots from '../GetDetachedDomNodeRoots/GetDetachedDomNodeRoots.js'
import * as SplitLines from '../SplitLines/SplitLines.js'

export const getDetachedDomNodesWithStackTraces = async (session, objectGroup) => {
  const fnResult1 = await GetDetachedDomNodeRoots.getDetachedDomNodeRoots(session, objectGroup)
  const fnResult2 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: fnResult1.objectId,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult2.result)
  const stackTraces = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
const detachedRoots = this

const getStackTrace = (detachedNode) => {
  return detachedNode.___stackTrace || ''
}

const getStackTraces = (detachedNodes) => {
  const stackTraces = []
  for(const detachedNode of detachedNodes){
    const stackTrace = getStackTrace(detachedNode)
    stackTraces.push(stackTrace)
  }
  return stackTraces
}

const stackTraces = getStackTraces(detachedRoots)
return stackTraces
}`,
    objectId: fnResult1.objectId,
    returnByValue: true,
    objectGroup,
  })
  const merged = []
  if (descriptors.length !== stackTraces.length) {
    throw new Error(`descriptor length mismatch`)
  }
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
