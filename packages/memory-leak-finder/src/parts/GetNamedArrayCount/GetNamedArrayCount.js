import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetFlatScopeList from '../GetFlatScopeList/GetFlatScopeList.js'

const getScopeItems = async (session, objectId) => {
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objectId,
    ownProperties: true,
    generatePreview: false,
  })
  const items = fnResult1.result
  return items
}

/**
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getNamedArrayCount = async (session, objectGroup) => {
  const flatScopeList = await GetFlatScopeList.getFlatScopeList(session, objectGroup)
  const maxLength = 10_000
  if (flatScopeList.length > maxLength) {
    flatScopeList.length = maxLength
  }
  const promises = []
  for (const item of flatScopeList) {
    promises.push(getScopeItems(session, item.objectId))
  }
  const scopeItems = await Promise.all(promises)
  const flatScopeItems = scopeItems.flat(1)
  console.log(flatScopeItems)
  return 0
}
