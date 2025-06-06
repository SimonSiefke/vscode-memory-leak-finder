import * as Assert from '../Assert/Assert.js'
import * as GetAllFunctions from '../GetAllFunctions/GetAllFunctions.js'
import * as GetFunctionScopeProperty from '../GetFunctionScopeProperty/GetFunctionScopeProperty.js'
import * as IsDefined from '../IsDefined/IsDefined.js'

export const getFunctionScopeProperties = async (session, objectGroup) => {
  Assert.object(session)
  Assert.string(objectGroup)
  const objectIds = await GetAllFunctions.getAllFunctions(session, objectGroup)
  const promises = []
  for (const objectId of objectIds) {
    promises.push(GetFunctionScopeProperty.getFunctionScopeProperty(session, objectGroup, objectId))
  }
  const scopeListsObjectIds = await Promise.all(promises)
  const defined = scopeListsObjectIds.filter(IsDefined.isDefined)
  return defined
}
