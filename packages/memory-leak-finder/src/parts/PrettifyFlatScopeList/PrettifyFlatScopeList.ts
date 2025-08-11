const prettifyFlatScopeListItem = (flatScopeListItem) => {
  const { value } = flatScopeListItem
  const { type, subtype, description, objectId } = value
  return {
    type,
    subtype,
    description,
    objectId,
  }
}

export const prettifyFlatScopeList = (flatScopeList) => {
  return flatScopeList.map(prettifyFlatScopeListItem)
}
