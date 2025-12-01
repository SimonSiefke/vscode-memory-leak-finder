import * as Assert from '../Assert/Assert.ts'
import * as ParseSpecialSelectorBody from '../ParseSpecialSelectorBody/ParseSpecialSelectorBody.ts'
import * as SpecialSelectorPrefix from '../SpecialSelectorPrefix/SpecialSelectorPrefix.ts'

const querySelectorRoot = (root: any, text: string): any[] => {
  Assert.object(root)
  Assert.string(text)
  let node
  const elements: any[] = []
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  while ((node = walk.nextNode())) {
    if (node.nodeValue === text) {
      elements.push(node.parentNode)
    }
  }
  return elements
}

export const querySelectorAll = (roots: any[], body: string): any[] => {
  Assert.array(roots)
  Assert.string(body)
  const text = ParseSpecialSelectorBody.parseString(body, SpecialSelectorPrefix.HasText)
  // TODO avoid closure
  return roots.flatMap((root) => {
    return querySelectorRoot(root, text)
  })
}
