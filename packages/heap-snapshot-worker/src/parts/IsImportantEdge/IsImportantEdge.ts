import * as IgnoredHeapSnapshotEdges from '../IgnoredHeapSnapshotEdges/IgnoredHeapSnapshotEdges.ts'

const ignoredSet = new Set(IgnoredHeapSnapshotEdges.ignoredHeapSnapshotEdges)

interface EdgeWithName {
  readonly name: string
}

export const isImportantEdge = (node: EdgeWithName): boolean => {
  return !ignoredSet.has(node.name)
}
