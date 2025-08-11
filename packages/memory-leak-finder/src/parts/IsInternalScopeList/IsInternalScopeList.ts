import * as ScopeListSubType from '../ScopeListSubType/ScopeListSubType.ts'
import * as ScopeListType from '../ScopeListType/ScopeListType.ts'

export const isInternalScopeList = (result) => {
  const { value } = result
  return value.type === ScopeListType.Object && value.subtype === ScopeListSubType.InternalScopeList
}
