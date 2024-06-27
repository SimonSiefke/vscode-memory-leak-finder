import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetFunctionScopeProperties from '../GetFunctionScopeProperties/GetFunctionScopeProperties.js'

const getScopeListProperties = async (session, objectId) => {
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objectId,
    ownProperties: true,
    generatePreview: false,
  })
  return fnResult1
}

const prettifyFlatScopeListItem = (flatScopeListItem) => {
  const { value } = flatScopeListItem
  const { type, subtype, description, objectId } = value
  return {
    type,
    subtype,
    description,
    objectId,
  }
}

const prettifyFlatScopeList = (flatScopeList) => {
  return flatScopeList.map(prettifyFlatScopeListItem)
}

export const getFlatScopeList = async (session, objectGroup) => {
  const scopeListsObjectIds = await GetFunctionScopeProperties.getFunctionScopeProperties(session, objectGroup)
  const promises2 = []
  for (const objectId of scopeListsObjectIds) {
    if (!objectId) {
      continue
    }
    promises2.push(getScopeListProperties(session, objectId))
  }
  const scopeLists = await Promise.all(promises2)
  const flatScopeList = scopeLists.flat(1)
  const prettyFlatScopeList = prettifyFlatScopeList(flatScopeList)
  return prettyFlatScopeList
}
