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
  const flatScopeLists = scopeLists.flat(1)
  return flatScopeLists
}
