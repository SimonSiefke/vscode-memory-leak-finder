import * as QuerySelectorAllRoot from '../QuerySelectorAllRoot/QuerySelectorAllRoot.ts'

export const querySelectorAll = (selector: string): readonly Element[] => {
  return QuerySelectorAllRoot.querySelectorAll(document.documentElement, selector)
}

/**
 *
 * @param {any} selector
 * @returns {HTMLElement|undefined}
 */
export const querySelector = (selector: string): Element | undefined => {
  return QuerySelectorAllRoot.querySelector(document.documentElement, selector)
}
