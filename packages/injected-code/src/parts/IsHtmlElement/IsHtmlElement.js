import * as HtmlElements from '../HtmlElements/HtmlElements.js'

export const isHtmlElement = (selector) => {
  return HtmlElements.htmlElements.includes(selector)
}
