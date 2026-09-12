import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolHeapProfiler, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

const isPendingPromise = (value: Dynamic): boolean => {
  const properties = value?.preview?.properties
  if (!Array.isArray(properties)) {
    return false
  }
  return properties.some((property: Dynamic) => property?.name === '[[PromiseState]]' && property?.value === 'pending')
}

export const getPendingPromiseHeapIds = async (session: Session, objectGroup: string): Promise<readonly string[]> => {
  try {
    const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
      expression: PrototypeExpression.Promise,
      objectGroup,
      returnByValue: false,
    })
    const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
      objectGroup,
      prototypeObjectId: prototype.objectId,
    })
    const properties = await DevtoolsProtocolRuntime.getProperties(session, {
      accessorPropertiesOnly: false,
      generatePreview: true,
      nonIndexedPropertiesOnly: false,
      objectId: objects.objects.objectId,
      ownProperties: true,
    })
    const promises = GetDescriptorValues.getDescriptorValues(properties.result).filter(isPendingPromise)
    return await Promise.all(
      promises.map(async (promise: Dynamic) => {
        const result = await DevtoolsProtocolHeapProfiler.getHeapObjectId(session, { objectId: promise.objectId })
        return String(result.heapSnapshotObjectId)
      }),
    )
  } finally {
    await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  }
}
