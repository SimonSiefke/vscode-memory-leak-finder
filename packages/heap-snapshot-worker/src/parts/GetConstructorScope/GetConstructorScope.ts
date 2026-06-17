import type { CleanedNode } from '../Snapshot/Snapshot.ts'

export interface ConstructorScope {
  readonly scopeEdge: string
  readonly scopeNode: CleanedNode
}

export const getConstructorScope = (
  parsedNodes: readonly CleanedNode[],
  constructorScopeMap: Uint32Array,
  edgeMap: readonly string[],
  node: CleanedNode,
): ConstructorScope => {
  // TODO avoid indexOf
  const nodeIndex = parsedNodes.indexOf(node)
  const constructorScopeIndex = constructorScopeMap[nodeIndex]
  const constructorScope = parsedNodes[constructorScopeIndex]
  const edge = edgeMap[nodeIndex]
  return {
    scopeEdge: edge,
    scopeNode: constructorScope,
  }
}
