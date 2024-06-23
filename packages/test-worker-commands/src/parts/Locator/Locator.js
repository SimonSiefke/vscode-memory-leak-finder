import * as LocatorClear from '../LocatorClear/LocatorClear.js'
import * as LocatorClick from '../LocatorClick/LocatorClick.js'
import * as LocatorClickExponential from '../LocatorClickExponential/LocatorClickExponential.js'
import * as LocatorCount from '../LocatorCount/LocatorCount.js'
import * as LocatorFocus from '../LocatorFocus/LocatorFocus.js'
import * as LocatorGetAttribute from '../LocatorGetAttribute/LocatorGetAttribute.js'
import * as LocatorHover from '../LocatorHover/LocatorHover.js'
import * as LocatorIsVisible from '../LocatorIsVisible/LocatorIsVisible.js'
import * as LocatorPress from '../LocatorPress/LocatorPress.js'
import * as LocatorSelectText from '../LocatorSelectText/LocatorSelectText.js'
import * as LocatorSetValue from '../LocatorSetValue/LocatorSetValue.js'
import * as LocatorTextContent from '../LocatorTextContent/LocatorTextContent.js'
import * as LocatorScrollDown from '../LocatorScrollDown/LocatorScrollDown.js'
import * as LocatorScrollUp from '../LocatorScrollUp/LocatorScrollUp.js'
import * as LocatorType from '../LocatorType/LocatorType.js'
import * as LocatorFill from '../LocatorFill/LocatorFill.js'
import * as ObjectType from '../ObjectType/ObjectType.js'

const mergeSelectors = (selector, subSelector = '', hasText = '', nth = -1) => {
  let merged = selector
  if (subSelector) {
    if (subSelector.startsWith('text=')) {
      const text = subSelector.slice('text='.length)
      return `${merged}:has-text("${text}")`
    } else if (merged) {
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
    fill(text) {
      return LocatorFill.fill(
        {
          selector: this.selector,
        },
        text,
      )
    },
    type(text) {
      return LocatorType.type(
        {
          selector: this.selector,
        },
        text,
      )
    },
    typeAndWaitFor(text, locator, options) {
      return LocatorType.typeAndWaitFor(
        {
          selector: this.selector,
        },
        text,
        {
          selector: locator.selector,
        },
        options,
      )
    },
    setValue(value) {
      return LocatorSetValue.setValue(
        {
          selector: this.selector,
        },
        value,
      )
    },
    click(options = {}) {
      return LocatorClick.click(
        {
          selector: this.selector,
        },
        options,
      )
    },
    clear() {
      return LocatorClear.clear({
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
    focus() {
      return LocatorFocus.focus({
        selector: this.selector,
      })
    },
    textContent() {
      return LocatorTextContent.getTextContent({
        selector: this.selector,
      })
    },
    selectText() {
      return LocatorSelectText.selectText({
        selector: this.selector,
      })
    },
    getAttribute(attributeName) {
      return LocatorGetAttribute.getAttribute(
        {
          selector: this.selector,
        },
        attributeName,
      )
    },
    clickExponential(options) {
      return LocatorClickExponential.clickExponential(
        {
          selector: this.selector,
        },
        options,
      )
    },
    press(key) {
      return LocatorPress.press(
        {
          selector: this.selector,
        },
        key,
      )
    },
    isVisible() {
      return LocatorIsVisible.isVisible({
        selector: this.selector,
      })
    },
    scrollDown() {
      return LocatorScrollDown.scrollDown({
        selector: this.selector,
      })
    },
    scrollUp() {
      return LocatorScrollUp.scrollUp({
        selector: this.selector,
      })
    },
  }
}
