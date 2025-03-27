import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as IsEnumerable from '../IsEnumerable/IsEnumerable.js'

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
  const ownProperties = rawResult.result.filter(IsEnumerable.isEnumerable)
  const values = ownProperties.map((property) => property.value)
  return values
}
