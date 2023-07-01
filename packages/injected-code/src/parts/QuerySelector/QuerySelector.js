import * as QuerySelectorAllRoot from '../QuerySelectorAllRoot/QuerySelectorAllRoot.js'

export const querySelectorAll = (selector) => {
  return QuerySelectorAllRoot.querySelectorAll(document.documentElement, selector)
}

export const querySelector = (selector) => {
  return QuerySelectorAllRoot.querySelector(document.documentElement, selector)
}
