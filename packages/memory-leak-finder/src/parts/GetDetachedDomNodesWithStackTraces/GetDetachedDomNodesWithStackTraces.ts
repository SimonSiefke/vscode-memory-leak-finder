import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as CleanDetachedDomNodesWithStackTraces from '../CleanDetachedDomNodesWithStackTraces/CleanDetachedDomNodesWithStackTraces.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ExpandStackTraceTable from '../ExpandStackTraceTable/ExpandStackTraceTable.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as GetDetachedDomNodeRoots from '../GetDetachedDomNodeRoots/GetDetachedDomNodeRoots.ts'
import * as SplitLines from '../SplitLines/SplitLines.ts'
export const getDetachedDomNodesWithStackTraces = async (session: Session, objectGroup: string, scriptMap: Record<string, Dynamic>) => {
  const fnResult1 = await GetDetachedDomNodeRoots.getDetachedDomNodeRoots(session, objectGroup)
  const fnResult2 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: fnResult1.objectId,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult2.result)
  const stackTraceTable = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
const detachedRoots = this

const getStackTrace = (detachedNode) => {
  return detachedNode.___stackTrace || ''
}

const getStackTraceTable = (detachedNodes) => {
  const stackTraceIndexes = []
  const stackTraces = []
  const stackTraceMap = new Map()
  for(const detachedNode of detachedNodes){
    const stackTrace = getStackTrace(detachedNode)
    let stackTraceIndex = stackTraceMap.get(stackTrace)
    if (stackTraceIndex === undefined) {
      stackTraceIndex = stackTraces.length
      stackTraceMap.set(stackTrace, stackTraceIndex)
      stackTraces.push(stackTrace)
    }
    stackTraceIndexes.push(stackTraceIndex)
  }
  return {
    stackTraceIndexes,
    stackTraces,
  }
}

return getStackTraceTable(detachedRoots)
}`,
    objectGroup,
    objectId: fnResult1.objectId,
    returnByValue: true,
  })
  const stackTraces = ExpandStackTraceTable.expandStackTraceTable(stackTraceTable, descriptors.length)
  const merged: Dynamic[] = []
  for (let i = 0; i < descriptors.length; i++) {
    const descriptor = descriptors[i]
    const stackTrace = stackTraces[i]
    merged.push({
      ...descriptor,
      stackTrace: SplitLines.splitLines(stackTrace),
    })
  }
  const clean = CleanDetachedDomNodesWithStackTraces.cleanDetachedDomNodesWithStackTraces(merged, scriptMap)
  return clean
}
