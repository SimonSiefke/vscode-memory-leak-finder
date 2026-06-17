import * as IgnoredHeapSnapshotEdges from '../IgnoredHeapSnapshotEdges/IgnoredHeapSnapshotEdges.ts'
import type { GraphEdge } from '../Snapshot/Snapshot.ts'

const ignoredSet = new Set(IgnoredHeapSnapshotEdges.ignoredHeapSnapshotEdges)

export const isImportantEdge = (edge: GraphEdge): boolean => {
  return !ignoredSet.has(edge.name)
}
