import * as Assert from '../Assert/Assert.js'

export const getConstructorNodes = (parsedNodes, constructorName) => {
  Assert.array(parsedNodes)
  Assert.string(constructorName)
  const filtered = []
  for (const node of parsedNodes) {
    if (node.type === 'object' && node.name === constructorName) {
      filtered.push(node)
    }
  }
  return filtered
}
