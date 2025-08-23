import * as GetFunctionScopeProperties from '../GetFunctionScopeProperties/GetFunctionScopeProperties.ts'
import * as GetScopeListProperties from '../GetScopeListProperties/GetScopeListProperties.ts'
import * as PrettifyFlatScopeList from '../PrettifyFlatScopeList/PrettifyFlatScopeList.ts'

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
  const flatScopeList = scopeLists.flat()
  const prettyFlatScopeList = PrettifyFlatScopeList.prettifyFlatScopeList(flatScopeList)
  return prettyFlatScopeList
}
