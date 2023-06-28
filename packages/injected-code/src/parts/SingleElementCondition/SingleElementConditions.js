import * as Assert from '../Assert/Assert.js'

export const toBeVisible = (element) => {
  if (typeof element.isVisible === 'function') {
    return element.isVisible()
  }
  return element.isConnected
}

export const toBeHidden = (element) => {
  return !toBeVisible(element)
}

export const toHaveValue = (element, { value }) => {
  return element.value === value
}

export const toHaveText = (element, { text }) => {
  Assert.string(text)
  return element.textContent === text
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
  return element.classList.contains(className)
}

export const toHaveId = (element, { id }) => {
  Assert.string(id)
  return element.id === id
}

export const toHaveCss = (element, { key, value }) => {
  Assert.string(key)
  const style = getComputedStyle(element)
  const actualValue = style[key]
  if (value instanceof RegExp) {
    return value.test(actualValue)
  }
  return actualValue === value
}
