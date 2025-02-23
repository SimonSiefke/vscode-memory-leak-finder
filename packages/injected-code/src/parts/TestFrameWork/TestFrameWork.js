import * as Assert from '../Assert/Assert.js'
import { AssertionError } from '../AssertionError/AssertionError.js'
import * as ConditionErrorMap from '../ConditionErrorMap/ConditionErrorMap.js'
import * as ElementAction from '../ElementAction/ElementAction.js'
import * as GetKeyboardEventOptions from '../GetKeyboardEventOptions/GetKeyboardEventOptions.js'
import * as KeyBoardActions from '../KeyBoardActions/KeyBoardActions.js'
import * as MultiElementConditionMap from '../MultiElementConditionMap/MultiElementConditionMap.js'
import * as QuerySelector from '../QuerySelector/QuerySelector.js'
import * as SingleElementConditionMap from '../SingleElementConditionMap/SingleElementConditionMap.js'

const create$Overlay = () => {
  const $TestOverlay = document.createElement('div')
  $TestOverlay.id = 'TestOverlay'
  $TestOverlay.style.position = 'fixed'
  $TestOverlay.style.bottom = '0px'
  $TestOverlay.style.left = '0px'
  $TestOverlay.style.right = '0px'
  $TestOverlay.style.height = '20px'
  $TestOverlay.style.whiteSpace = 'nowrap'
  $TestOverlay.style.contain = 'strict'
  $TestOverlay.style.userSelect = 'text'
  $TestOverlay.style.color = 'black'
  return $TestOverlay
}

export const showOverlay = (state, background, text) => {
  const $TestOverlay = create$Overlay()
  $TestOverlay.dataset.state = state
  $TestOverlay.style.background = background
  $TestOverlay.textContent = text
  document.body.append($TestOverlay)
}

const Time = {
  getTimeStamp() {
    return performance.now()
  },
}

const maxTimeout = 2000

const Timeout = {
  async short() {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  },
  async waitForMutation(element, maxDelay) {
    const disposables = []
    await Promise.race([
      new Promise((resolve) => {
        const timeout = setTimeout(resolve, maxDelay)
        disposables.push(() => {
          clearTimeout(timeout)
        })
      }),
      new Promise((resolve) => {
        const callback = (mutations) => {
          resolve(undefined)
        }
        const observer = new MutationObserver(callback)
        observer.observe(document.body, {
          childList: true,
          attributes: true,
          characterData: true,
          subtree: true,
          attributeOldValue: true,
          characterDataOldValue: true,
        })
        disposables.push(() => {
          observer.disconnect()
        })
      }),
    ])
    for (const disposable of disposables) {
      disposable()
    }
  },
}

export const performAction = async (locator, fnName, options) => {
  Assert.object(locator)
  Assert.string(fnName)
  Assert.object(options)
  const startTime = Time.getTimeStamp()
  const endTime = startTime + maxTimeout
  let currentTime = startTime
  const fn = ElementAction[fnName]
  if (!fn) {
    throw new Error(`action ${fnName} not found`)
  }
  while (currentTime < endTime) {
    const element = QuerySelector.querySelector(locator.selector)
    if (element) {
      fn(element, options)
      return
    }
    await Timeout.waitForMutation(document.body, 100)
    currentTime = Time.getTimeStamp()
  }
  throw new Error(`element not found ${locator.selector}`)
}

export const performKeyBoardAction = (fnName, options) => {
  const fn = KeyBoardActions[fnName]
  fn(options)
}

export const checkSingleElementCondition = async (locator, fnName, options) => {
  Assert.object(locator)
  Assert.string(fnName)
  Assert.object(options)
  const startTime = Time.getTimeStamp()
  const timeout = options.timeout || maxTimeout
  const endTime = startTime + timeout
  let currentTime = startTime
  const fn = SingleElementConditionMap.getFunction(fnName)
  while (currentTime < endTime) {
    const element = QuerySelector.querySelector(locator.selector)
    if (element) {
      const successful = fn(element, options)
      if (successful) {
        return
      }
    }
    await Timeout.waitForMutation(document.body, 100)
    currentTime = Time.getTimeStamp()
  }
  const errorMessageFn = ConditionErrorMap.getFunction(fnName)
  const message = errorMessageFn(locator, options)
  throw new AssertionError(message)
}

export const checkHidden = async (locator, options) => {
  Assert.object(locator)
  Assert.object(options)
  const startTime = Time.getTimeStamp()
  const timeout = options.timeout || maxTimeout
  const endTime = startTime + timeout
  let currentTime = startTime
  const fn = SingleElementConditionMap.getFunction('toBeHidden')
  while (currentTime < endTime) {
    const element = QuerySelector.querySelector(locator.selector)
    if (!element) {
      return
    }
    const successful = fn(element, options)
    if (successful) {
      return
    }
    await Timeout.waitForMutation(document.body, 100)
    currentTime = Time.getTimeStamp()
  }
  const errorMessageFn = ConditionErrorMap.getFunction('toBeHidden')
  const message = errorMessageFn(locator, options)
  throw new AssertionError(message)
}

export const checkTitle = async (expectedTitle) => {
  Assert.string(expectedTitle)
  const startTime = Time.getTimeStamp()
  const endTime = startTime + maxTimeout
  let currentTime = startTime
  while (currentTime < endTime) {
    const element = document.querySelector('title')
    if (element) {
      const successful = document.title === expectedTitle
      if (successful) {
        return
      }
    }
    await Timeout.waitForMutation(document.head, 100)
    currentTime = Time.getTimeStamp()
  }
  const message = `expected title to be "${expectedTitle}" but was "${document.title}"`
  throw new AssertionError(message)
}

export const checkMultiElementCondition = async (locator, fnName, options) => {
  const startTime = Time.getTimeStamp()
  const endTime = startTime + maxTimeout
  let currentTime = startTime
  const fn = MultiElementConditionMap.getFunction(fnName)
  while (currentTime < endTime) {
    const elements = QuerySelector.querySelectorAll(locator.selector)
    const successful = fn(elements, options)
    if (successful) {
      return
    }
    await Timeout.waitForMutation(document.body, 100)
    currentTime = Time.getTimeStamp()
  }
  const errorMessageFn = ConditionErrorMap.getFunction(fnName)
  const message = errorMessageFn(locator, options)
  throw new AssertionError(message)
}

export const pressKeyExponential = async ({ key, waitFor, timeout = maxTimeout }) => {
  Assert.string(key)
  Assert.object(waitFor)
  const locator = waitFor
  const exponentialFactor = 2
  const startTime = Time.getTimeStamp()
  const endTime = startTime + timeout
  let currentTime = startTime
  const toBeVisible = SingleElementConditionMap.getFunction('toBeVisible')
  let current = 1
  const keyboardEventOptions = GetKeyboardEventOptions.getKeyboardEventOptions(key)
  while (currentTime < endTime) {
    KeyBoardActions.press(keyboardEventOptions)
    const element = QuerySelector.querySelector(locator.selector)
    if (element && toBeVisible(element)) {
      return
    }
    current *= exponentialFactor
    await Timeout.waitForMutation(document.body, current)
    currentTime = Time.getTimeStamp()
  }
  const message = `expected locator "${locator.selector}" to be visible when pressing "${key}"`
  throw new AssertionError(message)
}

export const typeAndWaitFor = async ({ locator, text, waitFor, timeout = maxTimeout }) => {
  Assert.object(locator)
  Assert.string(text)
  Assert.object(waitFor)
  const exponentialFactor = 2
  const startTime = Time.getTimeStamp()
  const endTime = startTime + timeout
  let currentTime = startTime
  const toBeVisible = SingleElementConditionMap.getFunction('toBeVisible')
  let current = 1
  const fn = ElementAction['setValue']
  while (currentTime < endTime) {
    const waitForElement = QuerySelector.querySelector(waitFor.selector)
    if (waitForElement && toBeVisible(waitForElement)) {
      return
    }
    const element = QuerySelector.querySelector(locator.selector)
    fn(element, { text: '' })
    fn(element, { text })
    current *= exponentialFactor
    await Timeout.waitForMutation(document.body, current)
    currentTime = Time.getTimeStamp()
  }
  const message = `expected locator "${waitFor.selector}" to be visible within ${timeout}ms when typing "${text}"`
  throw new AssertionError(message)
}

export const clickExponential = async ({ locator, waitFor, waitForHidden, timeout = maxTimeout, button = '' }) => {
  const exponentialFactor = 2
  const startTime = Time.getTimeStamp()
  const endTime = startTime + timeout
  let currentTime = startTime
  const toBeHidden = SingleElementConditionMap.getFunction('toBeHidden')
  const toBeVisible = SingleElementConditionMap.getFunction('toBeVisible')
  let current = 1
  const clickOptions = {
    bubbles: true,
    button,
  }
  while (currentTime < endTime) {
    const element = QuerySelector.querySelector(locator.selector)
    if (element) {
      ElementAction.click(element, clickOptions)
    }
    if (waitFor) {
      const visibleElement = QuerySelector.querySelector(waitFor.selector)
      if (visibleElement && toBeVisible(visibleElement)) {
        return
      }
    } else if (waitForHidden) {
      const hiddenElement = QuerySelector.querySelector(waitForHidden.selector)
      if (!hiddenElement || toBeHidden(hiddenElement)) {
        return
      }
    }
    current *= exponentialFactor
    await Timeout.waitForMutation(document.body, current)
    currentTime = Time.getTimeStamp()
  }
  let message = ''
  if (waitForHidden) {
    message = `expected locator "${waitForHidden.selector}" to be hidden when clicking "${locator.selector}"`
  } else if (waitFor) {
    message = `expected locator "${waitFor.selector}" to be visible when clicking "${locator.selector}"`
  }
  throw new AssertionError(message)
}

export const pressKey = async (key) => {
  Assert.string(key)
  const keyboardEventOptions = GetKeyboardEventOptions.getKeyboardEventOptions(key)
  KeyBoardActions.press(keyboardEventOptions)
}

export const type = (text) => {
  Assert.string(text)
  const fn = ElementAction.type
  fn(document.activeElement, { text })
}

export const contentEditableInsert = ({ value }) => {
  // TODO find non-deprecated alternative
  document.execCommand('insertText', false, value)
}

export const getTextContent = async (locator) => {
  Assert.object(locator)
  const element = QuerySelector.querySelector(locator.selector)
  if (!element) {
    throw new Error(`element not found ${locator.selector}`)
  }
  const toBeVisible = SingleElementConditionMap.getFunction('toBeVisible')
  if (!toBeVisible(element)) {
    throw new Error(`must be visible`)
  }
  const text = element.textContent
  return text
}

export const getAttribute = async (locator, attributeName) => {
  Assert.object(locator)
  const element = QuerySelector.querySelector(locator.selector)
  if (!element) {
    throw new Error(`element not found ${locator.selector}`)
  }
  const toBeVisible = SingleElementConditionMap.getFunction('toBeVisible')
  if (!toBeVisible(element)) {
    throw new Error(`must be visible`)
  }
  const attributeValue = element.getAttribute(attributeName)
  return attributeValue
}

export const isVisible = async (locator) => {
  Assert.object(locator)
  const element = QuerySelector.querySelector(locator.selector)
  if (!element) {
    return false
  }
  const toBeVisible = SingleElementConditionMap.getFunction('toBeVisible')
  return toBeVisible(element)
}

export const count = (locator) => {
  Assert.object(locator)
  const elements = QuerySelector.querySelectorAll(locator.selector)
  const count = elements.length
  return count
}
