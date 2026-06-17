import * as IsIgnoredConstructorScopeEdge from '../IsIgnoredConstructorScopeEdge/IsIgnoredConstructorScopeEdge.ts'
import type { CleanedNode, HeapSnapshotGraph } from '../Snapshot/Snapshot.ts'

export const getConstructorScopeMap = (parsedNodes: readonly CleanedNode[], graph: HeapSnapshotGraph) => {
  const scopeMap = new Uint32Array(parsedNodes.length)
  const edgeMap: string[] = [...Array.from<string>({ length: parsedNodes.length }).fill('')]
  for (let i = 0; i < parsedNodes.length; i++) {
    const node = parsedNodes[i]
    const edges = graph[node.id]
    for (const edge of edges) {
      if (IsIgnoredConstructorScopeEdge.isIgnoredConstructorScopeEdge(edge)) {
        continue
      }
      if (scopeMap[edge.index]) {
        continue
      }
      scopeMap[edge.index] = i
      edgeMap[edge.index] = edge.name
    }
  }
  return {
    edgeMap,
    scopeMap,
  }
}
