import { actuallyDispatchEvent } from '../ActuallyDispatchEvent/ActuallyDispatchEvent.ts'
import * as Assert from '../Assert/Assert.ts'
import { AssertionError } from '../AssertionError/AssertionError.ts'
import * as ConditionErrorMap from '../ConditionErrorMap/ConditionErrorMap.ts'
import * as DomEventType from '../DomEventType/DomEventType.ts'
import * as ElementAction from '../ElementAction/ElementAction.ts'
import * as GetKeyboardEventOptions from '../GetKeyboardEventOptions/GetKeyboardEventOptions.ts'
import * as KeyBoardActions from '../KeyBoardActions/KeyBoardActions.ts'
import * as MultiElementConditionMap from '../MultiElementConditionMap/MultiElementConditionMap.ts'
import * as QuerySelector from '../QuerySelector/QuerySelector.ts'
import * as SingleElementConditionMap from '../SingleElementConditionMap/SingleElementConditionMap.ts'
import * as Timeout from '../Timeout/Timeout.ts'

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

export const showOverlay = (state: string, background: string, text: string): void => {
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

export const performAction = async (locator: Locator, fnName: string, options: unknown): Promise<void> => {
  Assert.object(locator)
  Assert.string(fnName)
  Assert.object(options)
  const startTime = Time.getTimeStamp()
  const endTime = startTime + maxTimeout
  let currentTime = startTime
  const fn = (ElementAction as unknown as { [key: string]: (element: Element, options: unknown) => void })[fnName]
  if (!fn) {
    throw new Error(`action ${fnName} not found`)
  }
  while (currentTime < endTime) {
    const element = QuerySelector.querySelector(locator.selector)
    if (element) {
      fn(element, options as any)
      return
    }
    await Timeout.waitForMutation(document.body, 100)
    currentTime = Time.getTimeStamp()
  }
  throw new Error(`element not found ${locator.selector}`)
}

export const performKeyBoardAction = (fnName: string, options: KeyboardEventInit): void => {
  if (fnName === 'press') {
    KeyBoardActions.press(options)
  } else {
    throw new Error(`keyboard action ${fnName} not found`)
  }
}

type Locator = {
  readonly selector: string
}

export const checkSingleElementCondition = async (locator: Locator, fnName: string, options: unknown): Promise<void> => {
  Assert.object(locator)
  Assert.string(fnName)
  Assert.object(options)
  const startTime = Time.getTimeStamp()
  const timeout = (options as { timeout?: number }).timeout || maxTimeout
  const endTime = startTime + timeout
  let currentTime = startTime
  const fn = SingleElementConditionMap.getFunction(fnName)
  while (currentTime < endTime) {
    const element = QuerySelector.querySelector(locator.selector)
    if (element) {
      const successful = fn(element, options as any)
      if (successful) {
        return
      }
    }
    await Timeout.waitForMutation(document.body, 100)
    currentTime = Time.getTimeStamp()
  }
  const errorMessageFn = ConditionErrorMap.getFunction(fnName)
  const message = errorMessageFn(locator, options as any)
  throw new AssertionError(message)
}

export const checkHidden = async (locator: Locator, options: { timeout?: number }): Promise<void> => {
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
    const successful = fn(element, options as any)
    if (successful) {
      return
    }
    await Timeout.waitForMutation(document.body, 100)
    currentTime = Time.getTimeStamp()
  }
  const errorMessageFn = ConditionErrorMap.getFunction('toBeHidden')
  const message = errorMessageFn(locator, options as any)
  throw new AssertionError(message)
}

export const checkTitle = async (expectedTitle: string): Promise<void> => {
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

export const checkMultiElementCondition = async (locator: Locator, fnName: string, options: { timeout?: number; count?: number }): Promise<void> => {
  const startTime = Time.getTimeStamp()
  const timeout = options.timeout || maxTimeout
  const endTime = startTime + timeout
  let currentTime = startTime
  const fn = MultiElementConditionMap.getFunction(fnName)
  while (currentTime < endTime) {
    const elements = QuerySelector.querySelectorAll(locator.selector)
    const successful = fn(elements, options as any)
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

export const pressKeyExponential = async ({ key, timeout = maxTimeout, waitFor }: { key: string; timeout?: number; waitFor: Locator }): Promise<void> => {
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
    if (element && toBeVisible(element, {})) {
      return
    }
    current *= exponentialFactor
    await Timeout.waitForMutation(document.body, current)
    currentTime = Time.getTimeStamp()
  }
  const message = `expected locator "${locator.selector}" to be visible when pressing "${key}"`
  throw new AssertionError(message)
}

export const typeAndWaitFor = async ({ locator, text, timeout = maxTimeout, waitFor }: { locator: Locator; text: string; timeout?: number; waitFor: Locator }): Promise<void> => {
  Assert.object(locator)
  Assert.string(text)
  Assert.object(waitFor)
  const exponentialFactor = 2
  const startTime = Time.getTimeStamp()
  const endTime = startTime + timeout
  let currentTime = startTime
  const toBeVisible = SingleElementConditionMap.getFunction('toBeVisible')
  let current = 1
  const fn = ElementAction.setValue
  while (currentTime < endTime) {
    const waitForElement = QuerySelector.querySelector(waitFor.selector)
    if (waitForElement && toBeVisible(waitForElement, {})) {
      return
    }
    const element = QuerySelector.querySelector(locator.selector)
    if (element && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      fn(element, { text: '' })
      fn(element, { text })
    }
    current *= exponentialFactor
    await Timeout.waitForMutation(document.body, current)
    currentTime = Time.getTimeStamp()
  }
  const message = `expected locator "${waitFor.selector}" to be visible within ${timeout}ms when typing "${text}"`
  throw new AssertionError(message)
}

export const clickExponential = async ({ button = '', locator, timeout = maxTimeout, waitFor, waitForHidden }: { button?: string; locator: Locator; timeout?: number; waitFor?: Locator; waitForHidden?: Locator }): Promise<void> => {
  const exponentialFactor = 2
  const startTime = Time.getTimeStamp()
  const endTime = startTime + timeout
  let currentTime = startTime
  const toBeHidden = SingleElementConditionMap.getFunction('toBeHidden')
  const toBeVisible = SingleElementConditionMap.getFunction('toBeVisible')
  let current = 1
  const buttonValue: number = button === 'right' ? 2 : (button ? Number.parseInt(button, 10) : 0)
  const clickOptions: MouseEventInit & { button?: number } = {
    bubbles: true,
    button: buttonValue,
  }
  while (currentTime < endTime) {
    const element = QuerySelector.querySelector(locator.selector)
    if (element) {
      ElementAction.click(element, clickOptions)
    }
    if (waitFor) {
      const visibleElement = QuerySelector.querySelector(waitFor.selector)
      if (visibleElement && toBeVisible(visibleElement, {})) {
        return
      }
    } else if (waitForHidden) {
      const hiddenElement = QuerySelector.querySelector(waitForHidden.selector)
      if (!hiddenElement || toBeHidden(hiddenElement, {})) {
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

export const pressKey = async (key: string): Promise<void> => {
  Assert.string(key)
  const keyboardEventOptions = GetKeyboardEventOptions.getKeyboardEventOptions(key)
  KeyBoardActions.press(keyboardEventOptions)
  if (
    key === 'Enter' &&
    document.activeElement &&
    (document.activeElement instanceof HTMLAnchorElement || document.activeElement instanceof HTMLButtonElement)
  ) {
    document.activeElement.click()
  }
}

export const type = (text: string): void => {
  Assert.string(text)
  const fn = ElementAction.type
  const activeElement = document.activeElement
  if (activeElement && (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement)) {
    fn(activeElement, { text })
  }
}

export const getValue = (locator: Locator): string => {
  const element = QuerySelector.querySelector(locator.selector)
  if (!element) {
    throw new Error(`element not found`)
  }
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value
  }
  throw new Error(`element is not an input or textarea`)
}

export const contentEditableInsert = ({ value }: { value: string }): void => {
  // TODO find non-deprecated alternative
  document.execCommand('insertText', false, value)
}

export const boundingBox = (locator: Locator): { height: number; width: number; x: number; y: number } => {
  const element = QuerySelector.querySelector(locator.selector)
  if (!element) {
    throw new Error(`element not found ${locator.selector}`)
  }
  const rect = element.getBoundingClientRect()
  return {
    height: rect.height,
    width: rect.width,
    x: rect.x,
    y: rect.y,
  }
}

const getTextFromSheet = (style: HTMLStyleElement) => {
  if (!style.sheet) {
    return ''
  }
  const all: string[] = []
  for (let i = 0; i < style.sheet.cssRules.length; i++) {
    const rule = style.sheet.cssRules.item(i)
    all.push(rule?.cssText || '')
  }
  return all.join('\n')
}

export const getTextContent = async (locator: Locator, { allowHidden = false }: { allowHidden?: boolean } = {}): Promise<string | null> => {
  Assert.object(locator)
  const element = QuerySelector.querySelector(locator.selector)
  if (!element) {
    throw new Error(`element not found ${locator.selector}`)
  }
  if (allowHidden) {
    const text = element.textContent
    if (text) {
      return text
    }
    if (element instanceof HTMLStyleElement) {
      return getTextFromSheet(element)
    }
    return text
  }

  const toBeVisible = SingleElementConditionMap.getFunction('toBeVisible')
  if (!toBeVisible(element, {})) {
    throw new Error(`must be visible`)
  }
  const text = element.textContent
  return text
}

export const getAttribute = async (locator: Locator, attributeName: string): Promise<string | null> => {
  Assert.object(locator)
  const element = QuerySelector.querySelector(locator.selector)
  if (!element) {
    throw new Error(`element not found ${locator.selector}`)
  }
  const toBeVisible = SingleElementConditionMap.getFunction('toBeVisible')
  if (!toBeVisible(element, {})) {
    throw new Error(`must be visible`)
  }
  const attributeValue = element.getAttribute(attributeName)
  return attributeValue
}

export const isVisible = async (locator: Locator): Promise<boolean> => {
  Assert.object(locator)
  const element = QuerySelector.querySelector(locator.selector)
  if (!element) {
    return false
  }
  const toBeVisible = SingleElementConditionMap.getFunction('toBeVisible')
  return toBeVisible(element, {})
}

export const count = (locator: Locator): number => {
  Assert.object(locator)
  const elements = QuerySelector.querySelectorAll(locator.selector)
  const count = elements.length
  return count
}

// TODO move mouseState to node process?
const mouseState = {
  x: 0,
  y: 0,
}

const pointerLikeEvent = (element: Element, pointerEventType: string, mouseEventType: string, x: number, y: number): void => {
  const button = 0
  const buttons = 0
  const bubbles = true
  actuallyDispatchEvent(element, pointerEventType, {
    // pointerType,
    bubbles,
    button,
    buttons,
    clientX: x,
    clientY: y,
    // pointerId,
  })
  actuallyDispatchEvent(element, mouseEventType, {
    // pointerType,
    bubbles,
    button,
    buttons,
    clientX: x,
    clientY: y,
    // pointerId,
  })
}

export const mouseDown = async (): Promise<void> => {
  const { x, y } = mouseState
  const element = document.elementFromPoint(x, y)
  if (!element) {
    throw new Error(`no element found at mouse position ${x} ${y}`)
  }
  pointerLikeEvent(element, DomEventType.PointerDown, DomEventType.MouseDown, x, y)
}

export const mouseMove = async (x: number, y: number): Promise<void> => {
  Assert.number(x)
  Assert.number(y)
  if (x < 0) {
    throw new Error(`x must be positive`)
  }
  if (y < 0) {
    throw new Error(`y must be positive`)
  }
  mouseState.x = x
  mouseState.y = y
  const element = document.elementFromPoint(x, y)
  if (!element) {
    throw new Error(`no element found at mouse position ${x} ${y}`)
  }
  pointerLikeEvent(element, DomEventType.PointerMove, DomEventType.MouseMove, x, y)
}

export const mouseUp = async (): Promise<void> => {
  const { x, y } = mouseState
  const element = document.elementFromPoint(x, y)
  if (!element) {
    throw new Error(`no element found at mouse position ${x} ${y}`)
  }
  pointerLikeEvent(element, DomEventType.PointerUp, DomEventType.MouseUp, x, y)
}
