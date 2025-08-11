import * as IgnoredConstructorScopeEdges from '../IgnoredConstructorScopeEdges/IgnoredConstructorScopeEdges.js'

export const isIgnoredConstructorScopeEdge = (edge) => {
  return IgnoredConstructorScopeEdges.ignoredConstructorScopeEdges.includes(edge.name)
}
