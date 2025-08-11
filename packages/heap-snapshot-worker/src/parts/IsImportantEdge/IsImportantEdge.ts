import * as IgnoredHeapSnapshotEdges from '../IgnoredHeapSnapshotEdges/IgnoredHeapSnapshotEdges.ts'

const ignoredSet = new Set(IgnoredHeapSnapshotEdges.ignoredHeapSnapshotEdges)

export const isImportantEdge = (node) => {
  return !ignoredSet.has(node.name)
}
