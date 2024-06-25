import * as ScopeListSubType from '../ScopeListSubType/ScopeListSubType.js'
import * as ScopeListType from '../ScopeListType/ScopeListType.js'

export const isInternalScopeList = (result) => {
  const { value } = result
  return value.type === ScopeListType.Object && value.subtype === ScopeListSubType.InternalScopeList
}
