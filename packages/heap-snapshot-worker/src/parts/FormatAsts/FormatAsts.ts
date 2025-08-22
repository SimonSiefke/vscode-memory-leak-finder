import type { ObjectNode } from '../AstNode/AstNode.ts'
import type { ScriptMap } from '../ReadScriptMap/ReadScriptMap.ts'
import { signatureFor } from '../SignatureForAstNode/SignatureForAstNode.ts'

const removePropertiesMaybe = (asts: readonly ObjectNode[], includeProperties: boolean): readonly ObjectNode[] => {
  if (includeProperties) {
    return asts
  }
  return asts.map((item) => {
    return {
      ...item,
      properties: [],
    }
  })
}

interface ObjectNodeExtended extends ObjectNode {
  readonly count: number
  readonly ids: readonly number[]
  readonly location?: string
}

interface CountMapItem {
  count: number
  ids: number[]
}

const collapseAstsMaybe = (asts: readonly ObjectNode[], collapse: boolean): readonly ObjectNode[] => {
  if (!collapse) {
    return asts
  }
  const depth = 1
  const map: Record<string, CountMapItem> = Object.create(null)
  for (const item of asts) {
    const hash = signatureFor(item, depth)
    map[hash] ||= { count: 0, ids: [] }
    map[hash].count++
    map[hash].ids.push(item.id)
  }
  const result: ObjectNodeExtended[] = []
  const seen: Record<string, boolean> = Object.create(null)
  for (const item of asts) {
    const hash = signatureFor(item, depth)
    if (hash in seen) {
      continue
    }
    seen[hash] = true
    result.push({
      ...item,
      count: map[hash].count,
      id: 0,
      ids: map[hash].ids,
    })
  }
  const sorted = result.toSorted((a, b) => {
    return b.count - a.count
  })
  return sorted
}

const addLocationStringMaybe = (
  asts: readonly ObjectNode[],
  outputLocations: boolean,
  scriptMap?: ScriptMap | null,
): readonly ObjectNode[] => {
  if (!outputLocations) {
    return asts
  }
  return asts.map((item) => {
    const loc = (item as any).closureLocations?.[0]
    if (loc && typeof loc.scriptId === 'number' && typeof loc.line === 'number' && typeof loc.column === 'number') {
      const script = scriptMap ? scriptMap[loc.scriptId] : undefined
      const scriptPart = script && script.url ? script.url : `${loc.scriptId}`
      return {
        ...item,
        location: `${scriptPart}:${loc.line}:${loc.column}`,
      } as any
    }
    return item
  })
}

export const formatAsts = (
  asts: readonly ObjectNode[],
  includeProperties: boolean,
  collapse: boolean,
  outputLocations: boolean = false,
  scriptMap?: ScriptMap | null,
): readonly ObjectNode[] => {
  const result1 = removePropertiesMaybe(asts, includeProperties)
  const result2 = addLocationStringMaybe(result1, outputLocations, scriptMap)
  const result3 = collapseAstsMaybe(result2, collapse)
  return result3
}
