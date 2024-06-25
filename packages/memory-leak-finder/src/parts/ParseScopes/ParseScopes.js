import * as IsInternalScopeList from '../IsInternalScopeList/IsInternalScopeList.js'

export const parseScopes = (result) => {
  const { internalProperties } = result
  const scope = internalProperties.find(IsInternalScopeList.isInternalScopeList)
  if (!scope) {
    return {
      objectId: '',
      description: '',
    }
  }
  return {
    objectId: scope.value.objectId,
    description: scope.value.description,
  }
}
