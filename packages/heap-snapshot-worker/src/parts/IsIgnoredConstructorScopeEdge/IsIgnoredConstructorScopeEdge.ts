import * as IgnoredConstructorScopeEdges from '../IgnoredConstructorScopeEdges/IgnoredConstructorScopeEdges.ts'
import type { GraphEdge } from '../Snapshot/Snapshot.ts'

export const isIgnoredConstructorScopeEdge = (edge: GraphEdge): boolean => {
  return IgnoredConstructorScopeEdges.ignoredConstructorScopeEdges.includes(edge.name)
}
