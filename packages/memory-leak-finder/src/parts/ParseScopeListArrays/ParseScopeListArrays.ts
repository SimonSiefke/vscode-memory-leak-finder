import type { Dynamic } from '../Types/Types.ts'
export const parseScopeListArrays = (scopeProperties: Dynamic) => {
  const nameMap = Object.create(null)
  for (const scopeProperty of scopeProperties) {
    nameMap[scopeProperty.value.objectId] = scopeProperty.name
  }
  return nameMap
}
