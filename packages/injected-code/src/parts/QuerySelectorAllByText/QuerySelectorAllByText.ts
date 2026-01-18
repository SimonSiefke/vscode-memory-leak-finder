import * as Assert from '../Assert/Assert.ts'
import * as ParseSpecialSelectorBody from '../ParseSpecialSelectorBody/ParseSpecialSelectorBody.ts'
import * as SpecialSelectorPrefix from '../SpecialSelectorPrefix/SpecialSelectorPrefix.ts'

const querySelectorRoot = (root: Element, text: string): Element[] => {
  Assert.object(root)
  Assert.string(text)
  let node: Node | null
  const elements: Element[] = []
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  while ((node = walk.nextNode())) {
    if (node.nodeValue === text && node.parentNode) {
      elements.push(node.parentNode as Element)
    }
  }
  return elements
}

export const querySelectorAll = (roots: readonly Element[], body: string, selector: string): Element[] => {
  Assert.array(roots)
  Assert.string(body)
  const text = ParseSpecialSelectorBody.parseString(body, SpecialSelectorPrefix.HasText)
  // TODO avoid closure
  return roots.flatMap((root) => {
    return querySelectorRoot(root, text)
  })
}
