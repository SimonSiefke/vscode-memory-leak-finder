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

const prettifyFlatScopeItem = (item) => {
  const { name, value } = item
  const { description } = value
  return { name, description }
}

const prettifyFlatScopeItems = (items) => {
  return items.map(prettifyFlatScopeItem)
}

const isArray = (flatScopeItem) => {
  return flatScopeItem && flatScopeItem.value && flatScopeItem.value.type === 'object' && flatScopeItem.value.subtype === 'array'
}

const filterArrays = (flatScopeItems) => {
  return flatScopeItems.filter(isArray)
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
  const filteredItems = filterArrays(flatScopeItems)
  const prettyItems = prettifyFlatScopeItems(filteredItems)
  return prettyItems
}
