import * as DispatchEvent from '../DispatchEvent/DispatchEvent.js'

const getNewValue = (value, selectionStart, selectionEnd, text) => {
  if (selectionStart === selectionEnd) {
    return value + text
  }
  return value.slice(0, selectionStart) + text + value.slice(selectionEnd)
}

export const type = (element, options) => {
  const selectionStart = element.selectionStart
  const selectionEnd = element.selectionEnd
  const newValue = getNewValue(element.value, selectionStart, selectionEnd, options.text)
  element.value = newValue
  DispatchEvent.input(element, {})
  DispatchEvent.change(element, {})
}
