import * as Assert from '../Assert/Assert.js'
import * as GetStyleValue from '../GetStyleValue/GetStyleValue.js'

export const toBeVisible = (element) => {
  if (typeof element.checkVisible === 'function') {
    return element.checkVisible()
  }
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility()
  }
  return element.isConnected
}

export const toBeHidden = (element) => {
  if (typeof element.checkVisible === 'function') {
    return !element.checkVisible()
  }
  const style = getComputedStyle(element)
  if (style.display === 'none') {
    return true
  }
  const rect = element.getBoundingClientRect()
  return rect.width === 0 || rect.height === 0
}

export const toHaveValue = (element, { value }) => {
  return element.value === value
}

export const toHaveText = (element, options) => {
  const existingText = element.textContent
  if ('text' in options) {
    Assert.string(options.text)
    return existingText === options.text
  }
  if ('regex' in options) {
    const regex = new RegExp(options.regex)
    return regex.test(existingText)
  }
  throw new Error(`invalid options`)
}

export const toHaveAttribute = (element, { key, value }) => {
  Assert.string(key)
  const attribute = element.getAttribute(key)
  return attribute === value
}

export const toBeFocused = (element) => {
  return element === document.activeElement
}

export const toHaveClass = (element, { className }) => {
  Assert.string(className)
  return element.className === className || element.classList.contains(className)
}

export const toHaveId = (element, { id }) => {
  Assert.string(id)
  return element.id === id
}

export const toHaveCss = (element, { key, value, isRegex }) => {
  Assert.string(key)
  const actualValue = GetStyleValue.getStyleValue(element, key)
  if (isRegex) {
    value = new RegExp(value.slice(1, -1))
    return value.test(actualValue)
  }
  return actualValue === value
}
