import * as QuerySelectorAllRoot from '../QuerySelectorAllRoot/QuerySelectorAllRoot.ts'

export const querySelectorAll = (selector: string): readonly Element[] => {
  return QuerySelectorAllRoot.querySelectorAll(document.documentElement, selector)
}

<<<<<<< HEAD
/**
 *
 * @param {any} selector
 * @returns {HTMLElement|undefined}
 */
export const querySelector = (selector: string): Element | undefined => {
=======
export const querySelector = (selector: string): HTMLElement | undefined => {
>>>>>>> origin/main
  return QuerySelectorAllRoot.querySelector(document.documentElement, selector)
}
