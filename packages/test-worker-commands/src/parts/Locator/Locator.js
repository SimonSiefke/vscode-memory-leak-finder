import * as LocatorClick from '../LocatorClick/LocatorClick.js'
import * as LocatorCount from '../LocatorCount/LocatorCount.js'
import * as LocatorHover from '../LocatorHover/LocatorHover.js'
import * as LocatorTextContent from '../LocatorTextContent/LocatorTextContent.js'
import * as LocatorType from '../LocatorType/LocatorType.js'
import * as ObjectType from '../ObjectType/ObjectType.js'

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
      return LocatorCount.count({
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
      return LocatorType.type(
        {
          selector: this.selector,
          hasText: this.hasText,
          _nth: this._nth,
        },
        text
      )
    },
    click() {
      return LocatorClick.click({
        selector: this.selector,
        hasText: this.hasText,
        _nth: this._nth,
      })
    },
    dblclick() {
      return LocatorClick.dblclick({
        selector: this.selector,
        hasText: this.hasText,
        _nth: this._nth,
      })
    },
    hover() {
      return LocatorHover.hover({
        selector: this.selector,
        hasText: this.hasText,
        _nth: this._nth,
      })
    },
    textContent() {
      return LocatorTextContent.getTextContent({
        selector: this.selector,
        hasText: this.hasText,
        _nth: this._nth,
      })
    },
  }
}
