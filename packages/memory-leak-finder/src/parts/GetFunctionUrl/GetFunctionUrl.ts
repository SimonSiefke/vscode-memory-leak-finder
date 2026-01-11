export const getFunctionUrl = (functionLocation, scriptMap) => {
  const match = scriptMap[functionLocation.scriptId]
  if (!match) {
    return ''
  }
  return match.url
}
