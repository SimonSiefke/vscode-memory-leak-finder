import * as HtmlElements from '../HtmlElements/HtmlElements.ts'

export const isHtmlElement = (selector) => {
  return HtmlElements.htmlElements.includes(selector)
}
