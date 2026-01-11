import * as Assert from '../Assert/Assert.ts'

interface NodeLike {
  readonly name: string
  readonly type: string
}

export const getConstructorNodes = <T extends NodeLike>(parsedNodes: readonly T[], constructorName: string): T[] => {
  Assert.array(parsedNodes)
  Assert.string(constructorName)
  const filtered: T[] = []
  for (const node of parsedNodes) {
    if (node.type === 'object' && node.name === constructorName) {
      filtered.push(node)
    }
  }
  return filtered
}
