import * as LocatorBlur from '../LocatorBlur/LocatorBlur.ts'
import * as LocatorBoundingBox from '../LocatorBoundingBox/LocatorBoundingBox.ts'
import * as LocatorClear from '../LocatorClear/LocatorClear.ts'
import * as LocatorClick from '../LocatorClick/LocatorClick.ts'
import * as LocatorClickExponential from '../LocatorClickExponential/LocatorClickExponential.ts'
import * as LocatorCount from '../LocatorCount/LocatorCount.ts'
import * as LocatorFill from '../LocatorFill/LocatorFill.ts'
import * as LocatorFocus from '../LocatorFocus/LocatorFocus.ts'
import * as LocatorGetAttribute from '../LocatorGetAttribute/LocatorGetAttribute.ts'
import * as LocatorGetValue from '../LocatorGetValue/LocatorGetValue.ts'
import * as LocatorHover from '../LocatorHover/LocatorHover.ts'
import * as LocatorIsVisible from '../LocatorIsVisible/LocatorIsVisible.ts'
import * as LocatorPress from '../LocatorPress/LocatorPress.ts'
import * as LocatorScrollDown from '../LocatorScrollDown/LocatorScrollDown.ts'
import * as LocatorScrollUp from '../LocatorScrollUp/LocatorScrollUp.ts'
import * as LocatorSelectText from '../LocatorSelectText/LocatorSelectText.ts'
import * as LocatorSetChecked from '../LocatorSetChecked/LocatorSetChecked.ts'
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

export const create = (rpc, sessionId, selector, { hasExactText = '', hasText = '', nth = -1 } = {}, utilityContext = {}) => {
  return {
    blur() {
      return LocatorBlur.blur(this)
    },
    boundingBox() {
      return LocatorBoundingBox.boundingBox(this)
    },
    clear() {
      return LocatorClear.clear(this)
    },
    click(options = {}) {
      return LocatorClick.click(this, options)
    },
    clickExponential(options) {
      return LocatorClickExponential.clickExponential(this, options)
    },
    count() {
      return LocatorCount.count(this)
    },
    dblclick() {
      return LocatorClick.dblclick(this)
    },
    fill(text: string) {
      return LocatorFill.fill(
        {
          ...this,
          selector: this.selector,
        },
        text,
      )
    },
    first() {
      return {
        ...this,
        selector: `${this.selector}:nth(0)`,
      }
    },
    focus() {
      return LocatorFocus.focus(this)
    },
    getAttribute(attributeName) {
      return LocatorGetAttribute.getAttribute(this, attributeName)
    },
    getValue() {
      return LocatorGetValue.getValue(this)
    },
    hover() {
      return LocatorHover.hover(this)
    },
    isVisible() {
      return LocatorIsVisible.isVisible(this)
    },
    locator(selector, { hasExactText = '', hasText = '', nth = -1 } = {}) {
      return {
        ...this,
        selector: mergeSelectors(this.selector, selector, hasText, hasExactText, nth),
      }
    },
    nth(value) {
      return {
        ...this,
        selector: `${this.selector}:nth(${value})`,
      }
    },
    objectType: ObjectType.Locator,
    press(key) {
      return LocatorPress.press(this, key)
    },
    rpc,
    scrollDown() {
      return LocatorScrollDown.scrollDown(this)
    },
    scrollUp() {
      return LocatorScrollUp.scrollUp(this)
    },
    selector: mergeSelectors('', selector, hasText, hasExactText, nth),
    selectText() {
      return LocatorSelectText.selectText(this)
    },
    sessionId,
    setChecked(value: boolean) {
      return LocatorSetChecked.setChecked(this, value)
    },
    setValue(value) {
      return LocatorSetValue.setValue(this, value)
    },
    textContent({ allowHidden = false } = {}) {
      return LocatorTextContent.getTextContent(this, { allowHidden })
    },
    type(text) {
      return LocatorType.type(this, text)
    },
    typeAndWaitFor(text, locator, options) {
      return LocatorType.typeAndWaitFor(
        this,
        text,
        {
          selector: locator.selector,
        },
        options,
      )
    },
    utilityContext,
  }
}
