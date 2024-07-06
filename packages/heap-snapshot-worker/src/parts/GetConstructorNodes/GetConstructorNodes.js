export const getConstructorNodes = (parsedNodes, constructorName) => {
  const filtered = []
  for (const node of parsedNodes) {
    if (node.type === 'object' && node.name === constructorName) {
      filtered.push(node)
    }
  }
  return filtered
}
