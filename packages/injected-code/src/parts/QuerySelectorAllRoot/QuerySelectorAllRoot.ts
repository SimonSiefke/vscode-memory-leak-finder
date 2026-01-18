import * as Assert from '../Assert/Assert.ts'
import * as ParseSelector from '../ParseSelector/ParseSelector.ts'
import * as QuerySelectorAll from '../QuerySelectorAll/QuerySelectorAll.ts'

export const querySelectorAll = (root: HTMLElement, selector: string): readonly HTMLElement[] => {
  Assert.object(root)
  Assert.string(selector)
  const parts = ParseSelector.parseSelector(selector)
  let currentRoots: HTMLElement[] = [root]
  for (const part of parts) {
    const { body, type } = part
    const module = QuerySelectorAll.getSelectorModule(type)
    currentRoots = module.querySelectorAll(currentRoots, body, selector) as HTMLElement[]
  }
  return currentRoots
}

export const querySelector = (root: HTMLElement, selector: string): HTMLElement | undefined => {
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
