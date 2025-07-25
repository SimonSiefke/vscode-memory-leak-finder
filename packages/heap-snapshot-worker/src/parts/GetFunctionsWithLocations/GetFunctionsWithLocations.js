export const getFunctionsWithLocations = (parsedNodes, locations, scriptMap) => {
  const functionsWithLocations = []
  for (const location of locations) {
    const script = scriptMap[location.scriptIdIndex]
    const url = script?.url || ''
    const node = parsedNodes[location.objectIndex]
    const together = {
      ...node,
      ...location,
      url,
    }
    functionsWithLocations.push(together)
  }
  return functionsWithLocations
}
