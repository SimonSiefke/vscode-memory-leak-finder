import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ExpandStackTraceTable from '../ExpandStackTraceTable/ExpandStackTraceTable.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'
export const getPromisesWithStackTraces = async (session: Session, objectGroup: string) => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Promise,
    objectGroup,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototype.objectId,
  })
  const stackTraceTable = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `
function () {
const promises = this
const stackTraceIndexes = []
const stackTraces = []
const stackTraceMap = new Map()
for (const promise of promises) {
  const item = globalThis.___promiseStackTraces.get(promise)
  const stackTrace = item || ''
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
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    accessorPropertiesOnly: false,
    generatePreview: true,
    nonIndexedPropertiesOnly: false,
    objectId: objects.objects.objectId,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult1.result)
  const stackTraces = ExpandStackTraceTable.expandStackTraceTable(stackTraceTable, descriptors.length)
  const withStackTraces = descriptors.map((descriptor: Dynamic, index: Dynamic) => {
    return {
      ...descriptor,
      stackTrace: stackTraces[index],
    }
  })
  return withStackTraces
}
