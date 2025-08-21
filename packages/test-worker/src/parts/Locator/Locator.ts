import * as LocatorBlur from '../LocatorBlur/LocatorBlur.ts'
import * as LocatorClear from '../LocatorClear/LocatorClear.ts'
import * as LocatorClick from '../LocatorClick/LocatorClick.ts'
import * as LocatorClickExponential from '../LocatorClickExponential/LocatorClickExponential.ts'
import * as LocatorCount from '../LocatorCount/LocatorCount.ts'
import * as LocatorFill from '../LocatorFill/LocatorFill.ts'
import * as LocatorFocus from '../LocatorFocus/LocatorFocus.ts'
import * as LocatorGetAttribute from '../LocatorGetAttribute/LocatorGetAttribute.ts'
import * as LocatorBoundingBox from '../LocatorBoundingBox/LocatorBoundingBox.ts'
import * as LocatorHover from '../LocatorHover/LocatorHover.ts'
import * as LocatorIsVisible from '../LocatorIsVisible/LocatorIsVisible.ts'
import * as LocatorPress from '../LocatorPress/LocatorPress.ts'
import * as LocatorScrollDown from '../LocatorScrollDown/LocatorScrollDown.ts'
import * as LocatorScrollUp from '../LocatorScrollUp/LocatorScrollUp.ts'
import * as LocatorSelectText from '../LocatorSelectText/LocatorSelectText.ts'
import * as LocatorSetValue from '../LocatorSetValue/LocatorSetValue.ts'
import * as LocatorTextContent from '../LocatorTextContent/LocatorTextContent.ts'
import * as LocatorType from '../LocatorType/LocatorType.ts'
import * as ObjectType from '../ObjectType/ObjectType.ts'

const mergeSelectors = (selector, subSelector = '', hasText = '', hasExactText = '', nth = -1) => {
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
  if (hasExactText) {
    merged += `:has-exact-text("${hasExactText}")`
  }
  if (nth !== -1) {
    merged += `:nth(${nth})`
  }
  return merged
}

export const create = (rpc, sessionId, selector, { hasText = '', hasExactText = '', nth = -1 } = {}) => {
  return {
    objectType: ObjectType.Locator,
    selector: mergeSelectors('', selector, hasText, hasExactText, nth),
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
    locator(selector, { hasText = '', hasExactText = '', nth = -1 } = {}) {
      return {
        ...this,
        selector: mergeSelectors(this.selector, selector, hasText, hasExactText, nth),
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
    boundingBox() {
      return LocatorBoundingBox.boundingBox({
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
    blur() {
      return LocatorBlur.blur({
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
