import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as IsEnumerable from '../IsEnumerable/IsEnumerable.ts'

/**
 *
 * @param {any} session
 * @param {any} objectGroup
 * @param {any} objectId
 * @returns {Promise<readonly any[]>}
 */
export const getPropertyValues = async (session, objectGroup, objectId) => {
  const rawResult = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objectId,
    generatePreview: false,
    ownProperties: true,
  })
  // TODO maybe filter properties in debugger instead of node because amount of properties can be huge
  const ownProperties = rawResult.result.filter(IsEnumerable.isEnumerable)
  const values = ownProperties.map((property) => property.value)
  return values
}
