import { dispatchEditContextUpdate } from '../DispatchEditContextUpdate/DispatchEditContextUpdate.ts'
import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

const getNewValue = (value, selectionStart, selectionEnd, text) => {
  if (selectionStart === selectionEnd) {
    return value + text
  }
  return value.slice(0, selectionStart) + text + value.slice(selectionEnd)
}

export const isInputElement = (element) => {
  return element && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)
}

export const type = (element, options) => {
  const { selectionStart } = element
  const { selectionEnd } = element
  const oldValue = element.value || ''
  const newValue = getNewValue(oldValue, selectionStart, selectionEnd, options.text)
  if (isInputElement(element)) {
    element.value = newValue
  }
  dispatchEditContextUpdate(element, newValue)
  DispatchEvent.input(element, {})
  const event = new InputEvent('input', {
    data: newValue,
  })
  element.dispatchEvent(event)
  DispatchEvent.change(element, {})
}
