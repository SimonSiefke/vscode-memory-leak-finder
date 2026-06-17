import { dispatchEditContextUpdate } from '../DispatchEditContextUpdate/DispatchEditContextUpdate.ts'
import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

const getNewValue = (value: string, selectionStart: number, selectionEnd: number, text: string): string => {
  if (selectionStart === selectionEnd) {
    return value + text
  }
  return value.slice(0, selectionStart) + text + value.slice(selectionEnd)
}

export const isInputElement = (element: unknown): element is HTMLInputElement | HTMLTextAreaElement => {
  return element !== null && element !== undefined && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)
}

export const type = (element: HTMLInputElement | HTMLTextAreaElement, options: { text: string }): void => {
  const selectionEnd = element.selectionEnd ?? element.value.length
  const selectionStart = element.selectionStart ?? 0
  const oldValue = element.value || ''
  const newValue = getNewValue(oldValue, selectionStart, selectionEnd, options.text)
  if (isInputElement(element)) {
    element.value = newValue
  }
  dispatchEditContextUpdate(element, newValue)
  DispatchEvent.input(element, {
    inputType: 'insertText',
  })
  DispatchEvent.change(element, {})
}
