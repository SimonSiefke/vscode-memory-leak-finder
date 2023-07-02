import * as Assert from '../Assert/Assert.js'
import * as ParseSpecialSelectorBody from '../ParseSpecialSelectorBody/ParseSpecialSelectorBody.js'
import * as SpecialSelectorPrefix from '../SpecialSelectorPrefix/SpecialSelectorPrefix.js'

const querySelectorRoot = (root, text) => {
  Assert.object(root)
  Assert.string(text)
  let node
  const elements = []
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  while ((node = walk.nextNode())) {
    if (node.nodeValue === text) {
      elements.push(node.parentNode)
    }
  }
  return elements
}

export const querySelectorAll = (roots, body) => {
  Assert.array(roots)
  Assert.string(body)
  const text = ParseSpecialSelectorBody.parseString(body, SpecialSelectorPrefix.HasText)
  if (roots.length === 1 && roots[0] === document.documentElement) {
    return querySelectorRoot(roots[0], text)
  }
  // TODO avoid closure
  return roots.filter((root) => {
    return (root.textContent = text)
  })
}
