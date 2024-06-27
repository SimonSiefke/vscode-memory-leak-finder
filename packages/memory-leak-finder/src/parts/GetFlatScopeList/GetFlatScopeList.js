import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetAllFunctions from '../GetAllFunctions/GetAllFunctions.js'
import * as GetFunctionScopeProperty from '../GetFunctionScopeProperty/GetFunctionScopeProperty.js'

const getScopeListProperties = async (session, objectId) => {
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objectId,
    ownProperties: true,
    generatePreview: false,
  })
  return fnResult1
}

export const getFlatScopeList = async (session, objectGroup) => {
  const objectIds = await GetAllFunctions.getAllFunctions(session, objectGroup)
  const promises = []
  for (const objectId of objectIds) {
    promises.push(GetFunctionScopeProperty.getFunctionScopeProperty(session, objectGroup, objectId))
  }
  const scopeListsObjectIds = await Promise.all(promises)
  const promises2 = []
  for (const objectId of scopeListsObjectIds) {
    if (!objectId) {
      continue
    }
    promises2.push(getScopeListProperties(session, objectId))
  }
  const scopeLists = await Promise.all(promises2)
  const flatScopeLists = scopeLists.flat(1)
  return flatScopeLists
}
