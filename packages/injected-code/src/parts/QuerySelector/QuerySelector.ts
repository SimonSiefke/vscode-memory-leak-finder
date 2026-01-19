import * as QuerySelectorAllRoot from '../QuerySelectorAllRoot/QuerySelectorAllRoot.ts'

export const querySelectorAll = (selector: string): readonly Element[] => {
  return QuerySelectorAllRoot.querySelectorAll(document.documentElement, selector)
}

export const querySelector = (selector: string): HTMLElement | undefined => {
  return QuerySelectorAllRoot.querySelector(document.documentElement, selector)
}
