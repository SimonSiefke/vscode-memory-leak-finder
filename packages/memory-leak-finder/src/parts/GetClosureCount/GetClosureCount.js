import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetAllFunctions from '../GetAllFunctions/GetAllFunctions.js'
import * as GetFunctionScopeProperty from '../GetFunctionScopeProperty/GetScopeProperties.js'

const getScopeListProperties = async (session, objectId) => {
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objectId,
    ownProperties: true,
    generatePreview: false,
  })
  return fnResult1
}

const isClosure = (scope) => {
  return scope.value && scope.value.type === 'object' && scope.value.description.startsWith('Closure (')
}

export const getClosureCount = async (session, objectGroup) => {
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
  const closures = flatScopeLists.filter(isClosure)
  const closureCount = closures.length
  return closureCount
}
