import type { Dynamic } from '../Types/Types.ts'
import * as ScopeListSubType from '../ScopeListSubType/ScopeListSubType.ts'
import * as ScopeListType from '../ScopeListType/ScopeListType.ts'
export const isInternalScopeList = (result: Dynamic) => {
  const { value } = result
  return value.type === ScopeListType.Object && value.subtype === ScopeListSubType.InternalScopeList
}
