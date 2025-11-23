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

export class CustomInputEvent extends Event {
  inputType: string
  data: any
  constructor(type, options) {
    super(type, options)
    this.inputType = 'insertText'
  }

  static inputType = 'insertText'
}

export const createCustomInputEvent = (options) => {
  // workaround for event being created utility context
  // and losing some properties when transferred to another context.
  //
  // Also workaround for chrome bug, inputType not working for inputEvent
  // const event = new Event('input', {})
  // // @ts-ignore
  // event.data = options.data
  // // @ts-ignore
  // event.inputType = 'insertText'
  return new InputEvent('input', { data: ' ', isComposing: false, inputType: 'insertText' })
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
  const event = new CustomInputEvent('input', {
    data: newValue,
  })
  element.dispatchEvent(event)
  DispatchEvent.change(element, {})
}
