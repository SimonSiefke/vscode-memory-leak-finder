import * as IgnoredConstructorScopeEdges from '../IgnoredConstructorScopeEdges/IgnoredConstructorScopeEdges.ts'
import type { GraphEdge } from '../Snapshot/Snapshot.ts'

export const isIgnoredConstructorScopeEdge = (edge: GraphEdge): boolean => {
  if (typeof edge.name !== 'string') {
    return false
  }
  return IgnoredConstructorScopeEdges.ignoredConstructorScopeEdges.includes(edge.name)
}
