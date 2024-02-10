import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetRemoteObjectLength from '../GetRemoteObjectLength/GetRemoteObjectLength.js'

/**
 *
 * @param {any} session
 * @param {string} prototype
 * @returns {Promise<number>}
 */
export const getObjectCount = async (session, prototype, objectGroup = undefined) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: prototype,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
    objectGroup,
  })
  const fnResult1 = await GetRemoteObjectLength.getRemoteObjectLength(session, objects.objects.objectId, objectGroup)
  return fnResult1
}
