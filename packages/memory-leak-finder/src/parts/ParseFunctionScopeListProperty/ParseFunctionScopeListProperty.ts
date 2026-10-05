import type { Dynamic } from '../Types/Types.ts'
import * as IsInternalScopeList from '../IsInternalScopeList/IsInternalScopeList.ts'
export const parseFunctionScopeListProperty = (result: Dynamic) => {
  const { internalProperties } = result
  const scope = internalProperties.find(IsInternalScopeList.isInternalScopeList)
  if (!scope) {
    return ''
  }
  return scope.value.objectId
}
