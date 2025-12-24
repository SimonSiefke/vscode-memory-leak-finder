import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as IsEnumerable from '../IsEnumerable/IsEnumerable.ts'
import type { Session } from '../Session/Session.ts'

/**
 *
 * @param {any} session
 * @param {any} objectGroup
 * @param {any} objectId
 * @returns {Promise<readonly any[]>}
 */
export const getPropertyValues = async (session: Session, objectGroup, objectId) => {
  const rawResult = await DevtoolsProtocolRuntime.getProperties(session, {
    generatePreview: false,
    objectId: objectId,
    ownProperties: true,
  })
  // TODO maybe filter properties in debugger instead of node because amount of properties can be huge
  const ownProperties = rawResult.result.filter(IsEnumerable.isEnumerable)
  const values = ownProperties.map((property) => property.value)
  return values
}
