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

interface Combined extends LocationLike {
  readonly url: string
  readonly sourceMapUrl: string
  readonly [key: string]: unknown
}

export const getFunctionsWithLocations = (
  parsedNodes: readonly unknown[],
  locations: readonly LocationLike[],
  scriptMap: Record<number, ScriptInfo>,
): Combined[] => {
  const functionsWithLocations: Combined[] = []
  for (const location of locations) {
    const script = scriptMap[location.scriptIdIndex]
    const url = script?.url || ''
    const sourceMapUrl = script?.sourceMapUrl || ''
    const node = parsedNodes[location.objectIndex]
    const together: Combined = {
      ...(node as Record<string, unknown>),
      ...location,
      url,
      sourceMapUrl,
    }
    functionsWithLocations.push(together)
  }
  return functionsWithLocations
}
