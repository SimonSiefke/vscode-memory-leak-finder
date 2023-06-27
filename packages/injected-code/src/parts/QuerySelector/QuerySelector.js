import { htmlElements } from '../HtmlElements/HtmlElements.js'

const querySelectorByText = (root, text) => {
  let node
  const elements = []
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  while ((node = walk.nextNode())) {
    // @ts-ignore
    if (node.nodeValue === text) {
      elements.push(node.parentNode)
    }
  }
  return elements
}

const querySelectorByCss = (selector) => {
  return Array.from(document.querySelectorAll(selector))
}

const isElement = (selector) => {
  return htmlElements.includes(selector)
}

export const querySelector = (selector) => {
  if (typeof selector !== 'string') {
    throw new TypeError(`selector must be of type string but was ${selector}`)
  }
  if (selector.startsWith('text=')) {
    return querySelectorByText(document.body, selector.slice('text='.length))
  }
  if (selector.includes('text=')) {
    const index = selector.indexOf('text=')
    const elements = querySelectorByCss(selector.slice(0, index))
    const text = selector.slice(index + 'text='.length)
    return elements.flatMap((element) => {
      return querySelectorByText(element, text)
    })
    // for(const element of elements)
  }
  if (selector.startsWith('.')) {
    return querySelectorByCss(selector)
  }
  if (selector.startsWith('#')) {
    return querySelectorByCss(selector)
  }
  if (selector.startsWith('[data') || selector.startsWith('[title')) {
    return querySelectorByCss(selector)
  }
  if (isElement(selector)) {
    return querySelectorByCss(selector)
  }
  throw new Error(`unsupported selector: ${selector}`)
}

const toButtonNumber = (buttonType) => {
  switch (buttonType) {
    case 'left':
      return 0
    case 'middle':
      return 1
    case 'right':
      return 2
    default:
      throw new Error(`unsupported button type: ${buttonType}`)
  }
}

export const querySelectorWithOptions = (selector, { nth = -1, hasText = '' } = {}) => {
  let elements = querySelector(selector)
  if (hasText) {
    elements = elements.filter((element) => element.textContent === hasText)
  }
  if (elements.length === 0) {
    return undefined
  }
  if (elements.length === 1) {
    const element = elements[0]
    return element
  }
  if (nth === -1) {
    throw new Error(`too many matching elements for ${selector}, matching ${elements.length}`)
  }
  const element = elements[nth]
  if (!element) {
    throw new Error(`selector not found: ${selector}`)
  }
  return element
}
