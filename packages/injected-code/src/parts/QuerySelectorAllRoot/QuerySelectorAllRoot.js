import * as Assert from '../Assert/Assert.js'
import * as ParseSelector from '../ParseSelector/ParseSelector.js'
import * as QuerySelectorAll from '../QuerySelectorAll/QuerySelectorAll.js'

export const querySelectorAll = (root, selector) => {
  Assert.object(root)
  Assert.string(selector)
  const parts = ParseSelector.parseSelector(selector)
  console.log({ parts })
  let currentRoots = [root]
  for (const part of parts) {
    const { type, body } = part
    const module = QuerySelectorAll.getSelectorModule(type)
    currentRoots = module.querySelectorAll(currentRoots, body, selector)
  }
  return currentRoots
}

export const querySelector = (root, selector) => {
  Assert.object(root)
  Assert.string(selector)
  const elements = querySelectorAll(root, selector)
  if (elements.length > 1) {
    // TODO
    // throw new Error(`too many matching elements for ${selector}, matching ${elements.length}`)
    return elements[0]
  }
  if (elements.length === 0) {
    return undefined
  }
  return elements[0]
}
