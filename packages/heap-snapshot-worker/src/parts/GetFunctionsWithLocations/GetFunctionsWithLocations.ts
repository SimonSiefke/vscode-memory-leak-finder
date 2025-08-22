import type { FunctionObject } from '../NormalizeFunctionObjects/NormalizeFunctionObjects.ts'
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
      url,
      lineIndex: location.lineIndex,
      columnIndex: location.columnIndex,
      name: typeof node.name === 'string' ? (node.name as string) : '',
      sourceMapUrl: sourceMapUrl || null,
    }
    functionsWithLocations.push(item)
  }
  return functionsWithLocations
}
