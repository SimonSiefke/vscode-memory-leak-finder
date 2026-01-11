import type { FunctionObject } from '../NormalizeFunctionObjects/NormalizeFunctionObjects.ts'
interface LocationLike {
  readonly columnIndex: number
  readonly lineIndex: number
  readonly objectIndex: number
  readonly scriptIdIndex: number
}

interface ScriptInfo {
  readonly sourceMapUrl?: string
  readonly url?: string
}

export const getFunctionsWithLocations = (
  parsedNodes: readonly unknown[],
  locations: readonly LocationLike[],
  scriptMap: Record<number, ScriptInfo>,
): FunctionObject[] => {
  const functionsWithLocations: FunctionObject[] = []
  for (const location of locations) {
    const script = scriptMap[location.scriptIdIndex]
    const url = script?.url || ''
    const sourceMapUrl = script?.sourceMapUrl || ''
    const node = parsedNodes[location.objectIndex] as Record<string, unknown>
    const item: FunctionObject = {
      columnIndex: location.columnIndex,
      lineIndex: location.lineIndex,
      name: typeof node.name === 'string' ? node.name : '',
      sourceMapUrl: sourceMapUrl || null,
      url,
    }
    functionsWithLocations.push(item)
  }
  return functionsWithLocations
}
