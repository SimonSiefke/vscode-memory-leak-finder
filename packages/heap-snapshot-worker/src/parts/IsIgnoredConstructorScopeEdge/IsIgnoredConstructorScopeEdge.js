export const isIgnoredConstructorScopeEdge = (edge) => {
  return edge.name === 'this' || edge.name === 'bound_this'
}
