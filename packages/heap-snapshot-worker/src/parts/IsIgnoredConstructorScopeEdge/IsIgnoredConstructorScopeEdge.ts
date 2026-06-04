import * as IgnoredConstructorScopeEdges from '../IgnoredConstructorScopeEdges/IgnoredConstructorScopeEdges.ts'

interface EdgeWithName {
  readonly name: string
}

export const isIgnoredConstructorScopeEdge = (edge: EdgeWithName): boolean => {
  return IgnoredConstructorScopeEdges.ignoredConstructorScopeEdges.includes(edge.name)
}
