import * as Assert from '../Assert/Assert.ts'
import * as ParseSelector from '../ParseSelector/ParseSelector.ts'
import * as QuerySelectorAll from '../QuerySelectorAll/QuerySelectorAll.ts'

<<<<<<< HEAD
export const querySelectorAll = (root: Element, selector: string): Element[] => {
=======
export const querySelectorAll = (root: HTMLElement, selector: string): readonly HTMLElement[] => {
>>>>>>> origin/main
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

<<<<<<< HEAD
export const querySelector = (root: Element, selector: string): Element | undefined => {
=======
export const querySelector = (root: HTMLElement, selector: string): HTMLElement | undefined => {
>>>>>>> origin/main
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
