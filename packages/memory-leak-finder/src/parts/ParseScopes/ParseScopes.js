import * as IsInternalScopeList from '../IsInternalScopeList/IsInternalScopeList.js'

export const parseScopes = (result) => {
  const { internalProperties } = result
  const scope = internalProperties.find(IsInternalScopeList.isInternalScopeList)
  if (!scope) {
    return ''
  }
  return scope.value.objectId
}
