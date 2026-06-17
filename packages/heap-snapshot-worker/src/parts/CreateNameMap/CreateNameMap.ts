import type { CleanedNode, HeapSnapshotGraph, HeapSnapshotValue } from '../Snapshot/Snapshot.ts'

export interface NameMapEntry {
  readonly edgeName: HeapSnapshotValue
  readonly nodeName: string
}

export const createNameMap = (parsedNodes: readonly CleanedNode[], graph: HeapSnapshotGraph): Record<number, NameMapEntry> => {
  const nameMap: Record<number, NameMapEntry> = Object.create(null)
  for (const node of parsedNodes) {
    const edges = graph[node.id]
    for (const edge of edges) {
      const toNode = parsedNodes[edge.index]
      nameMap[toNode.id] ||= {
        edgeName: edge.name,
        nodeName: toNode.name,
      }
    }
  }
  return nameMap
}
