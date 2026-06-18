import * as Assert from '../Assert/Assert.ts'

const querySelectorRoot = (root: Element, body: string): readonly HTMLElement[] => {
  Assert.object(root)
  Assert.string(body)
  const nodeList = root.querySelectorAll<HTMLElement>(body)
  return [...nodeList]
}

export const querySelectorAll = (roots: readonly Element[], body: string, _selector: string): readonly HTMLElement[] => {
  Assert.array(roots)
  Assert.string(body)
  return roots.flatMap((root) => {
    return querySelectorRoot(root, body)
  })
}
