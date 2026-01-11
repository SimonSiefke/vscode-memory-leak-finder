const prettifyFlatScopeListItem = (flatScopeListItem) => {
  const { value } = flatScopeListItem
  const { description, objectId, subtype, type } = value
  return {
    description,
    objectId,
    subtype,
    type,
  }
}

export const prettifyFlatScopeList = (flatScopeList) => {
  return flatScopeList.map(prettifyFlatScopeListItem)
}
