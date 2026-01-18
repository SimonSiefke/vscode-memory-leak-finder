import * as Assert from '../Assert/Assert.ts'

const querySelectorRoot = (root: Element, body: string): readonly HTMLElement[] => {
  Assert.object(root)
  Assert.string(body)
  const nodeList = root.querySelectorAll(body) as NodeListOf<HTMLElement>
  return Array.from(nodeList)
}

export const querySelectorAll = (roots: readonly Element[], body: string, _selector: string): readonly HTMLElement[] => {
  Assert.array(roots)
  Assert.string(body)
  return roots.flatMap((root) => {
    return querySelectorRoot(root, body)
  })
}
