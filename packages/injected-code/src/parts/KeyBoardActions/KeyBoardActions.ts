import * as Assert from '../Assert/Assert.ts'
import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'
import { isInputElement } from '../ElementActionType/ElementActionType.ts'

const getAllOptions = (options: KeyboardEventInit) => {
  if (options.key === ' ' || options.key === 'Space') {
    return [
      {
        ...options,
        bubbles: true,
        cancelable: true,
        code: 'Space',
        key: ' ',
        keyCode: 32,
      },
    ]
  }
  if (options.key === '.') {
    return [
      {
        ...options,
        bubbles: true,
        cancelable: true,
        code: 'Period',
        key: '.',
        keyCode: 190,
      },
    ]
  }
  const allOptions = [options]

  // if (options.ctrlKey) {
  //   allOptions.unshift({
  //     ...options,
  //     key: 'Control',
  //     keyCode: GetKeyCode.getKeyCode('Control'),
  //     code: GetKeyCode.getCode('Control'),
  //   })
  // }
  // if (options.metaKey) {
  //   allOptions.unshift({
  //     ...options,
  //     key: 'Meta',
  //     keyCode: GetKeyCode.getKeyCode('Meta'),
  //     code: GetKeyCode.getKeyCode('Meta'),
  //   })
  // }
  // if (options.shiftKey) {
  //   allOptions.unshift({
  //     ...options,
  //     key: 'Shift',
  //     keyCode: GetKeyCode.getKeyCode('Shift'),
  //     code: GetKeyCode.getKeyCode('Shift'),
  //   })
  // }
  return allOptions
}

const isSpaceLike = (key: string) => {
  return key === ' ' || key === 'Space'
}

export const press = (options: KeyboardEventInit, element: Element | null = document.activeElement) => {
  if (!element) {
    throw new Error(`element not found`)
  }
  Assert.object(options)
  const allOptions = getAllOptions(options)
  for (const option of allOptions) {
    const event = DispatchEvent.keyDown(element, option)
    // @ts-ignore
    if (event?.defaultPrevented) {
      return
    }
  }
  for (const option of allOptions) {
    DispatchEvent.keyPress(element, option)
  }
  if (isInputElement(element) && options.key && isSpaceLike(options.key)) {
    element.dispatchEvent(new InputEvent('input', { data: ' ', inputType: 'insertText', isComposing: false }))
  }
  for (const option of allOptions) {
    DispatchEvent.keyUp(element, option)
  }
}
