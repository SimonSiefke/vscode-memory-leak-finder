export const getFunctionsWithLocations = (parsedNodes, locations, scriptMap) => {
  const functionsWithLocations: any[] = []
  for (const location of locations) {
    const script = scriptMap[location.scriptIdIndex]
    const url = script?.url || ''
    const sourceMapUrl = script?.sourceMapUrl || ''
    const node = parsedNodes[location.objectIndex]
    const together = {
      ...node,
      ...location,
      url,
      sourceMapUrl,
    }
    functionsWithLocations.push(together)
  }
  return functionsWithLocations
}
