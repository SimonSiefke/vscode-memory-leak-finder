import * as Assert from '../Assert/Assert.ts'
import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'
import { CustomInputEvent, isInputElement } from '../ElementActionType/ElementActionType.ts'
import * as GetKeyCode from '../GetKeyCode/GetKeyCode.ts'

const getAllOptions = (options) => {
  if (options.key === ' ' || options.key === 'Space') {
    return [
      {
        ...options,
        keyCode: 32,
        code: 'Space',
        key: ' ',
        bubbles: true,
        cancelable: true,
      },
    ]
  }
  const allOptions = [options]

  if (options.ctrlKey) {
    allOptions.unshift({
      ...options,
      key: 'Control',
      keyCode: GetKeyCode.getKeyCode('Control'),
      code: GetKeyCode.getCode('Control'),
    })
  }
  if (options.metaKey) {
    allOptions.unshift({
      ...options,
      key: 'Meta',
      keyCode: GetKeyCode.getKeyCode('Meta'),
      code: GetKeyCode.getKeyCode('Meta'),
    })
  }
  if (options.shiftKey) {
    allOptions.unshift({
      ...options,
      key: 'Shift',
      keyCode: GetKeyCode.getKeyCode('Shift'),
      code: GetKeyCode.getKeyCode('Shift'),
    })
  }
  return allOptions
}

export const press = (options, element = document.activeElement) => {
  if (!element) {
    throw new Error(`element not found`)
  }
  Assert.object(options)
  const allOptions = getAllOptions(options)
  for (const option of allOptions) {
    DispatchEvent.keyDown(element, option)
  }
  for (const option of allOptions) {
    DispatchEvent.keyPress(element, option)
  }
  if ((isInputElement(element) && options.key === ' ') || options.key === 'Space') {
    element.dispatchEvent(
      new CustomInputEvent('input', {
        data: ' ',
      }),
    )
  }
  for (const option of allOptions) {
    DispatchEvent.keyUp(element, option)
  }
}
