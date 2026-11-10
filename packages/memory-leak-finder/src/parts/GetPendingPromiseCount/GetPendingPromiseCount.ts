import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
export const getPendingPromiseCount = async (session: Session, objectGroup: string): Promise<number> => {
  try {
    const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
      expression: PrototypeExpression.Promise,
      objectGroup,
      returnByValue: false,
    })
    const fnResult1 = await DevtoolsProtocolRuntime.queryObjects(session, {
      objectGroup,
      prototypeObjectId: prototype.objectId,
    })
    const fnResult2 = await DevtoolsProtocolRuntime.getProperties(session, {
      accessorPropertiesOnly: false,
      generatePreview: true,
      nonIndexedPropertiesOnly: false,
      objectId: fnResult1.objects.objectId,
      ownProperties: false,
    })
    const descriptors = GetDescriptorValues.getDescriptorValues(fnResult2.result)
    return descriptors.filter((descriptor: Dynamic) =>
      descriptor.preview?.properties?.some((item: Dynamic) => item.name === '[[PromiseState]]' && item.value === 'pending'),
    ).length
  } finally {
    // Do not keep the baseline promises alive until the next measurement.
    await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  }
}
