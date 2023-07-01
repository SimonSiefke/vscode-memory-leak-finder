import * as LocatorClick from '../LocatorClick/LocatorClick.js'
import * as LocatorCount from '../LocatorCount/LocatorCount.js'
import * as LocatorHover from '../LocatorHover/LocatorHover.js'
import * as LocatorTextContent from '../LocatorTextContent/LocatorTextContent.js'
import * as LocatorType from '../LocatorType/LocatorType.js'
import * as ObjectType from '../ObjectType/ObjectType.js'

const mergeSelectors = (selector, subSelector = '', hasText = '', nth = -1) => {
  let merged = selector
  if (subSelector) {
    if (merged) {
      merged += ` ${subSelector}`
    } else {
      merged = subSelector
    }
  }
  if (hasText) {
    merged += `:has-text("${hasText}")`
  }
  if (nth !== -1) {
    merged += `:nth(${nth})`
  }
  return merged
}

export const create = (rpc, sessionId, selector, { hasText = '', nth = -1 } = {}) => {
  return {
    objectType: ObjectType.Locator,
    selector: mergeSelectors('', selector, hasText, nth),
    sessionId,
    nth(value) {
      return {
        ...this,
        selector: `${this.selector}:nth(${value})`,
      }
    },
    first() {
      return {
        ...this,
        selector: `${this.selector}:nth(0)`,
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
        selector: mergeSelectors(this.selector, selector, hasText, nth),
      }
    },
    type(text) {
      return LocatorType.type(
        {
          selector: this.selector,
        },
        text
      )
    },
    click() {
      return LocatorClick.click({
        selector: this.selector,
      })
    },
    dblclick() {
      return LocatorClick.dblclick({
        selector: this.selector,
      })
    },
    hover() {
      return LocatorHover.hover({
        selector: this.selector,
      })
    },
    textContent() {
      return LocatorTextContent.getTextContent({
        selector: this.selector,
      })
    },
  }
}
