import type { Dynamic } from '../Types/Types.ts'
const prettifyFlatScopeListItem = (flatScopeListItem: Dynamic) => {
  const { value } = flatScopeListItem
  const { description, objectId, subtype, type } = value
  return {
    description,
    objectId,
    subtype,
    type,
  }
}
export const prettifyFlatScopeList = (flatScopeList: Dynamic) => {
  return flatScopeList.map(prettifyFlatScopeListItem)
}
