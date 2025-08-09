import * as Assert from '../Assert/Assert.ts'
import * as GetStyleValue from '../GetStyleValue/GetStyleValue.ts'

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
  if (element.value === value) {
    return true
  }
  if (element.editContext && typeof element.editContext.text === 'string') {
    return element.editContext.text === value
  }
  return false
}

export const toHaveText = (element, options) => {
  const existingText = element.textContent
  if ('text' in options) {
    Assert.string(options.text)
    return existingText === options.text
  }
  if ('regex' in options) {
    const regex = new RegExp(options.regex, 'i')
    return regex.test(existingText)
  }
  throw new Error(`invalid options`)
}

export const toHaveAttribute = (element, { key, value, isRegex }) => {
  Assert.string(key)
  const actualValue = element.getAttribute(key)
  if (isRegex) {
    value = new RegExp(value.slice(1, -1))
    return value.test(actualValue)
  }
  return actualValue === value
}

export const toBeFocused = (element) => {
  return element === document.activeElement
}

export const toHaveClass = (element, { className }) => {
  Assert.string(className)
  return element.className === className || element.classList.contains(className)
}

export const notToHaveClass = (element, { className }) => {
  Assert.string(className)
  return !element.classList.contains(className)
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
