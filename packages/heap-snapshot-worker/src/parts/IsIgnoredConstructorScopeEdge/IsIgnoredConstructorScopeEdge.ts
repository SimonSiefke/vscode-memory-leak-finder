import * as IgnoredConstructorScopeEdges from '../IgnoredConstructorScopeEdges/IgnoredConstructorScopeEdges.ts'

export const isIgnoredConstructorScopeEdge = (edge) => {
  return IgnoredConstructorScopeEdges.ignoredConstructorScopeEdges.includes(edge.name)
}
