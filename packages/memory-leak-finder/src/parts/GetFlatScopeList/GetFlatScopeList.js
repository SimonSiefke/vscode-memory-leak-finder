import * as GetFunctionScopeProperties from '../GetFunctionScopeProperties/GetFunctionScopeProperties.js'
import * as GetScopeListProperties from '../GetScopeListProperties/GetScopeListProperties.js'
import * as PrettifyFlatScopeList from '../PrettifyFlatScopeList/PrettifyFlatScopeList.js'

export const getFlatScopeList = async (session, objectGroup) => {
  const scopeListsObjectIds = await GetFunctionScopeProperties.getFunctionScopeProperties(session, objectGroup)
  const promises2 = []
  for (const objectId of scopeListsObjectIds) {
    if (!objectId) {
      continue
    }
    promises2.push(GetScopeListProperties.getScopeListProperties(session, objectId))
  }
  const scopeLists = await Promise.all(promises2)
  const flatScopeList = scopeLists.flat(1)
  const prettyFlatScopeList = PrettifyFlatScopeList.prettifyFlatScopeList(flatScopeList)
  return prettyFlatScopeList
}
