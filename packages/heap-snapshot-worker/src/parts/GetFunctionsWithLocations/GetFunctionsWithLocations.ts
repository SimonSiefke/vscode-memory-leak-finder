interface FunctionWithLocation {
  [key: string]: any
  url: string
  sourceMapUrl: string
}

export const getFunctionsWithLocations = (parsedNodes: any[], locations: any[], scriptMap: any[]): FunctionWithLocation[] => {
  const functionsWithLocations: FunctionWithLocation[] = []
  for (const location of locations) {
    const script = scriptMap[location.scriptIdIndex]
    const url = script?.url || ''
    const sourceMapUrl = script?.sourceMapUrl || ''
    const node = parsedNodes[location.objectIndex]
    const together: FunctionWithLocation = {
      ...node,
      ...location,
      url,
      sourceMapUrl,
    }
    functionsWithLocations.push(together)
  }
  return functionsWithLocations
}
