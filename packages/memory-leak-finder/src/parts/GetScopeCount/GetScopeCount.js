import * as GetAllFunctions from '../GetAllFunctions/GetAllFunctions.js'
import * as GetAllScopeProperties from '../GetAllScopeProperties/GetAllScopeProperties.js'

export const getScopeCount = async (session, objectGroup) => {
  const objectIds = await GetAllFunctions.getAllFunctions(session, objectGroup)
  const scopeProperties = await GetAllScopeProperties.getAllScopeProperties(session, objectGroup, objectIds)
  return scopeProperties.length
}
