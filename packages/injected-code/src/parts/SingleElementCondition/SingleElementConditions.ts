import * as Assert from '../Assert/Assert.ts'
import * as GetStyleValue from '../GetStyleValue/GetStyleValue.ts'

export const toBeVisible = (element: Element): boolean => {
  const elementWithCheckVisible = element as Element & { checkVisible?: () => boolean; checkVisibility?: () => boolean }
  if (typeof elementWithCheckVisible.checkVisible === 'function') {
    return elementWithCheckVisible.checkVisible()
  }
  if (typeof elementWithCheckVisible.checkVisibility === 'function') {
    return elementWithCheckVisible.checkVisibility()
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

export const toHaveValue = (element: HTMLInputElement | HTMLTextAreaElement, { value }: { value: string }): boolean => {
  if (element.value === value) {
    return true
  }
  const elementWithEditContext = element as HTMLInputElement & { editContext?: { text?: string } }
  if (elementWithEditContext.editContext && typeof elementWithEditContext.editContext.text === 'string') {
    return elementWithEditContext.editContext.text === value
  }
  return false
}

export const toHaveText = (element: Element, options: { text?: string; regex?: string }): boolean => {
  const existingText = element.textContent
  if ('text' in options) {
    Assert.string(options.text)
    return existingText === options.text
  }
  if ('regex' in options) {
    const regex = new RegExp(options.regex, 'i')
    return regex.test(existingText)
  }
  throw new Error(`invalid options: text or regex is required`)
}

export const toHaveAttribute = (element: Element, { isRegex, key, value }: { isRegex?: boolean; key: string; value: string }): boolean => {
  Assert.string(key)
  const actualValue = element.getAttribute(key)
  if (isRegex) {
    const regex = new RegExp(value.slice(1, -1))
    return regex.test(actualValue ?? '')
  }
  return actualValue === value
}

export const toBeFocused = (element: Element): boolean => {
  return element === document.activeElement
}

export const toHaveClass = (element: Element, { className }: { className: string }): boolean => {
  Assert.string(className)
  return element.className === className || element.classList.contains(className)
}

export const notToHaveClass = (element: Element, { className }: { className: string }): boolean => {
  Assert.string(className)
  return !element.classList.contains(className)
}

export const toHaveId = (element: Element, { id }: { id: string }): boolean => {
  Assert.string(id)
  return element.id === id
}

export const toHaveCss = (element: Element, { isRegex, key, value }: { isRegex?: boolean; key: string; value: string }): boolean => {
  Assert.string(key)
  const actualValue = GetStyleValue.getStyleValue(element, key)
  if (isRegex) {
    const regex = new RegExp(value.slice(1, -1))
    return regex.test(actualValue ?? '')
  }
  return actualValue === value
}
