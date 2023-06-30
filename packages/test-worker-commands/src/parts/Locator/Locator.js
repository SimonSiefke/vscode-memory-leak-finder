import * as ObjectType from '../ObjectType/ObjectType.js'
import * as PageClick from '../PageClick/PageClick.js'
import * as PageCount from '../PageCount/PageCount.js'
import * as PageHover from '../PageHover/PageHover.js'
import * as PageTextContent from '../PageTextContent/PageTextContent.js'
import * as PageType from '../PageType/PageType.js'

export const create = (rpc, sessionId, selector, { hasText = '', nth = -1 } = {}) => {
  return {
    objectType: ObjectType.Locator,
    selector,
    sessionId,
    hasText,
    _nth: nth,
    nth(value) {
      return {
        ...this,
        selector: `${this.selector}`,
        _nth: value + 1,
      }
    },
    first() {
      return {
        ...this,
        selector: `${this.selector}`,
        _nth: 1,
      }
    },
    count() {
      return PageCount.count({
        selector: this.selector,
      })
    },
    locator(selector, { hasText = '', nth = -1 } = {}) {
      return {
        ...this,
        selector: `${this.selector} ${selector}`,
        hasText,
        _nth: nth,
      }
    },
    type(text) {
      return PageType.type(
        {
          selector: this.selector,
          hasText: this.hasText,
          _nth: this._nth,
        },
        text
      )
    },
    click() {
      return PageClick.click({
        selector: this.selector,
        hasText: this.hasText,
        _nth: this._nth,
      })
    },
    dblclick() {
      return PageClick.dblclick({
        selector: this.selector,
        hasText: this.hasText,
        _nth: this._nth,
      })
    },
    hover() {
      return PageHover.hover({
        selector: this.selector,
        hasText: this.hasText,
        _nth: this._nth,
      })
    },
    textContent() {
      return PageTextContent.getTextContent({
        selector: this.selector,
        hasText: this.hasText,
        _nth: this._nth,
      })
    },
  }
}
