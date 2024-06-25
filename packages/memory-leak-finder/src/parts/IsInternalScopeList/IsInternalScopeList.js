export const isInternalScopeList = (value) => {
  return typeof value === 'object' && value.type === 'object' && value.subtype === 'internal#scopeList'
}
