import * as IgnoredConstructorScopeEdges from '../IgnoredConstructorScopeEdges/IgnoredConstructorScopeEdges.ts'

export const isIgnoredConstructorScopeEdge = (edge: any) => {
  return IgnoredConstructorScopeEdges.ignoredConstructorScopeEdges.includes(edge.name)
}
