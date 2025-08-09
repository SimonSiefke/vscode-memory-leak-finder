import * as GetStyleValue from '../GetStyleValue/GetStyleValue.ts'
import * as QuerySelector from '../QuerySelector/QuerySelector.ts'
import * as StringifyElement from '../StringifyElement/StringifyElement.ts'

export const toBeVisible = (locator, options) => {
  if (options.timeout) {
    return `expected selector to be visible ${locator.selector} within ${options.timeout} ms`
  }
  return `expected selector to be visible ${locator.selector}`
}

export const toHaveValue = (locator, { value }) => {
  const element = QuerySelector.querySelector(locator.selector)
  const locatorString = printLocator(locator)
  if (!element) {
    return `expected selector ${locatorString} to have value "${value}" element was not found`
  }
  // @ts-ignore
  return `expected selector ${locatorString} to have text "${value}" but was "${element.value}"`
}

const printLocator = (locator) => {
  if (locator._nth !== -1 && locator._nth !== undefined) {
    return `${locator.selector}:nth(${locator._nth})`
  }
  if (locator.hasText) {
    return `${locator.selector} "${locator.hasText}"`
  }
  return `${locator.selector}`
}

export const toHaveText = (locator, options) => {
  const element = QuerySelector.querySelector(locator.selector)
  const locatorString = printLocator(locator)
  if (!element) {
    if ('text' in options) {
      return `expected selector ${locatorString} to have text "${options.regex}" element was not found`
    }
    if ('regex' in options) {
      return `expected selector ${locatorString} to match "${options.regex}" element was not found`
    }
    return 'unknown text error'
  }
  if ('text' in options) {
    return `expected selector ${locatorString} to have text "${options.text}" but was "${element.textContent}"`
  }
  if ('regex' in options) {
    return `expected selector ${locatorString} to match "${options.regex}" but was "${element.textContent}"`
  }
  return 'unknown text error'
}

export const toHaveAttribute = (locator, { key, value }) => {
  const element = QuerySelector.querySelector(locator.selector)
  const locatorString = printLocator(locator)
  if (!element) {
    return `expected ${locatorString} to have attribute ${key} ${value} but element was not found`
  }
  const actual = element.getAttribute(key)
  return `expected ${locatorString} to have attribute ${key} ${value} but was ${actual}`
}

export const toHaveCount = (locator, { count }) => {
  const elements = QuerySelector.querySelectorAll(locator.selector)
  const actualCount = elements.length
  const locatorString = printLocator(locator)
  return `expected ${locatorString} to have count ${count} but was ${actualCount}`
}

export const toBeFocused = (locator) => {
  const locatorString = printLocator(locator)
  const activeElement = document.activeElement
  const stringifiedActiveElement = StringifyElement.stringifyElement(activeElement)
  return `expected ${locatorString} to be focused but active element is ${stringifiedActiveElement}`
}

export const toHaveClass = (locator, { className }) => {
  const element = QuerySelector.querySelector(locator.selector)
  const locatorString = printLocator(locator)
  if (!element) {
    return `expected ${locatorString} to have class ${className} but element was not found`
  }
  return `expected ${locatorString} to have class "${className}" but was "${element.className}"`
}

export const toHaveId = (locator, { id }) => {
  const element = QuerySelector.querySelector(locator.selector)
  const locatorString = printLocator(locator)
  if (!element) {
    return `expected ${locatorString} to have id ${id} but element was not found`
  }
  return `expected ${locatorString} to have id ${id} but was ${element.id}`
}

export const toBeHidden = (locator) => {
  const locatorString = printLocator(locator)
  return `expected ${locatorString} to be hidden`
}

export const toHaveCss = (locator, { key, value }) => {
  const element = QuerySelector.querySelector(locator.selector)
  const locatorString = printLocator(locator)
  if (!element) {
    return `expected ${locatorString} to have css ${key}: ${value} but element was not found`
  }
  const actual = GetStyleValue.getStyleValue(element, key)
  return `expected ${locatorString} to have css "${key}": "${value}" but was "${actual}"`
}
