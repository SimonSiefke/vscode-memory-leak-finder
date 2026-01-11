export const parseScopeListArrays = (scopeProperties) => {
  const nameMap = Object.create(null)
  for (const scopeProperty of scopeProperties) {
    nameMap[scopeProperty.value.objectId] = scopeProperty.name
  }
  return nameMap
}
