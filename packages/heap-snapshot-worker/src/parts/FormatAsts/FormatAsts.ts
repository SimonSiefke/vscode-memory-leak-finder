import type { ObjectNode } from '../AstNode/AstNode.ts'
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

interface AstNodeWithCount extends ObjectNode {
  readonly count: number
}

const collapseAstsMaybe = (asts: readonly ObjectNode[], collapse: boolean): readonly ObjectNode[] => {
  if (!collapse) {
    return asts
  }
  const depth = 1
  const map = Object.create(null)
  for (const item of asts) {
    const hash = signatureFor(item, depth)
    console.log({ item, hash })
    map[hash] ||= 0
    map[hash]++
  }
  const result: AstNodeWithCount[] = []
  const seen: Record<string, boolean> = Object.create(null)
  for (const item of asts) {
    const hash = signatureFor(item, depth)
    if (hash in seen) {
      continue
    }
    seen[hash] = true
    result.push({
      ...item,
      count: map[hash],
    })
  }
  const sorted = result.toSorted((a, b) => {
    return b.count - a.count
  })
  return sorted
}

export const formatAsts = (asts: readonly ObjectNode[], includeProperties: boolean, collapse: boolean): readonly ObjectNode[] => {
  const result1 = removePropertiesMaybe(asts, includeProperties)
  const result2 = collapseAstsMaybe(result1, collapse)
  return result2
}
