import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as IsEnumerable from '../IsEnumerable/IsEnumerable.ts'
/**
 *
 * @param {unknown} session
 * @param {unknown} objectGroup
 * @param {unknown} objectId
 * @returns {Promise<readonly unknown[]>}
 */
export const getPropertyValues = async (session: Session, objectGroup: Dynamic, objectId: Dynamic) => {
  const rawResult = await DevtoolsProtocolRuntime.getProperties(session, {
    generatePreview: false,
    objectId: objectId,
    ownProperties: true,
  })
  // TODO maybe filter properties in debugger instead of node because amount of properties can be huge
  const ownProperties = rawResult.result.filter(IsEnumerable.isEnumerable)
  const values = ownProperties.map((property: Dynamic) => property.value)
  return values
}
