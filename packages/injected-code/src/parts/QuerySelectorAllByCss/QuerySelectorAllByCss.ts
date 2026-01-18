import * as Assert from '../Assert/Assert.ts'

const querySelectorRoot = (root: Element, body: string): Element[] => {
  Assert.object(root)
  Assert.string(body)
  const nodeList = root.querySelectorAll(body)
  return Array.from(nodeList)
}

export const querySelectorAll = (roots: readonly Element[], body: string): Element[] => {
  Assert.array(roots)
  Assert.string(body)
  return roots.flatMap((root) => {
    return querySelectorRoot(root, body)
  })
}
