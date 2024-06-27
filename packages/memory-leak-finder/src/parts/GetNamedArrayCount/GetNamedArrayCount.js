import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetFlatScopeList from '../GetFlatScopeList/GetFlatScopeList.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

const getScopeItems = async (session, objectGroup, objectId) => {
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objectId,
    ownProperties: true,
    generatePreview: false,
    objectGroup,
  })
  await DevtoolsProtocolRuntime.releaseObjectGroup(session, {
    objectGroup,
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

const getNamedArrayCountInternal = async (session, objectGroup, partialFlatScopeList) => {
  const promises = []
  for (const item of partialFlatScopeList) {
    promises.push(getScopeItems(session, objectGroup, item.objectId))
  }
  const scopeItems = await Promise.all(promises)
  const flatScopeItems = scopeItems.flat(1)
  const filteredItems = filterArrays(flatScopeItems)
  const prettyItems = prettifyFlatScopeItems(filteredItems)
  return prettyItems
}

/**
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getNamedArrayCount = async (session, objectGroup, stepSize) => {
  const flatScopeList = await GetFlatScopeList.getFlatScopeList(session, objectGroup)
  let remaining = flatScopeList
  const allResults = []
  let count = 0
  while (remaining.length > 0) {
    console.log('count', count)
    console.log('loop, remaining', remaining.length)
    const partial = remaining.slice(0, stepSize)
    const objectGroup = ObjectGroupId.create()
    const result = await getNamedArrayCountInternal(session, objectGroup, partial)
    count += result.length
    allResults.push(result)
    remaining = remaining.slice(stepSize)
  }
  const allResultsFlat = allResults.flat(1)
  return allResultsFlat
}
