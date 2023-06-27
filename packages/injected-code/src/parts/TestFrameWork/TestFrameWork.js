import * as Assert from '../Assert/Assert.js'
import { AssertionError } from '../AssertionError/AssertionError.js'
import * as ConditionErrorMap from '../ConditionErrorMap/ConditionErrorMap.js'
import * as ElementActions from '../ElementActions/ElementActions.js'
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
  const fn = ElementActions[fnName]
  while (currentTime < endTime) {
    const element = QuerySelector.querySelectorWithOptions(locator.selector, {
      hasText: locator._hasText,
      nth: locator._nth,
    })
    if (element) {
      fn(element, options)
      console.log('action was performed')
      return
    }
    await Timeout.waitForMutation(document.body, 100)
    currentTime = Time.getTimeStamp()
  }
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
  const endTime = startTime + options.timeout || maxTimeout
  let currentTime = startTime
  const fn = SingleElementConditionMap.getFunction(fnName)
  while (currentTime < endTime) {
    const element = QuerySelector.querySelectorWithOptions(locator.selector, {
      hasText: locator._hasText,
      nth: locator._nth,
    })
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
    const elements = QuerySelector.querySelector(locator.selector)
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

const getKeyboardEventOptions = (rawKey) => {
  let ctrlKey = false
  let key = ''
  if (rawKey.startsWith('Control+')) {
    ctrlKey = true
    rawKey = rawKey.slice('Control+'.length)
  }
  key = rawKey
  return {
    ctrlKey,
    key,
  }
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
  const keyboardEventOptions = getKeyboardEventOptions(key)
  while (currentTime < endTime) {
    KeyBoardActions.press(keyboardEventOptions)
    console.log('press', keyboardEventOptions)
    const element = QuerySelector.querySelectorWithOptions(locator.selector, {
      hasText: locator._hasText,
      nth: locator._nth,
    })
    if (element && toBeVisible(element)) {
      return
    }
    current *= exponentialFactor
    await Timeout.waitForMutation(document.body, current)
    currentTime = Time.getTimeStamp()
  }
  await new Promise((r) => {})
  const message = `expected locator "${locator.selector}" to be visible when pressing "${key}"`
  throw new AssertionError(message)
}
