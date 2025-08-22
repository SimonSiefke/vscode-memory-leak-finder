interface LocationLike {
  readonly objectIndex: number
  readonly scriptIdIndex: number
  readonly lineIndex: number
  readonly columnIndex: number
}

interface ScriptInfo {
  readonly url?: string
  readonly sourceMapUrl?: string
}

interface FunctionWithLocation extends LocationLike {
  readonly url: string
  readonly sourceMapUrl: string
  readonly name: string
  readonly [key: string]: unknown
}

export const getFunctionsWithLocations = (
  parsedNodes: readonly unknown[],
  locations: readonly LocationLike[],
  scriptMap: Record<number, ScriptInfo>,
): FunctionWithLocation[] => {
  const functionsWithLocations: FunctionWithLocation[] = []
  for (const location of locations) {
    const script = scriptMap[location.scriptIdIndex]
    const url = script?.url || ''
    const sourceMapUrl = script?.sourceMapUrl || ''
    const node = parsedNodes[location.objectIndex] as Record<string, unknown>
    const together: FunctionWithLocation = {
      ...node,
      ...location,
      url,
      sourceMapUrl,
      name: typeof node.name === 'string' ? (node.name as string) : '',
    }
    functionsWithLocations.push(together)
  }
  return functionsWithLocations
}
