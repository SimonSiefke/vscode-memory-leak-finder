import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

export const click = (element: Element, options: Omit<MouseEventInit, 'button'> & { button?: number | 'right' }): void => {
  const rect = element.getBoundingClientRect()
  const mutableOptions = options as Omit<MouseEventInit, 'button'> & {
    button?: number | 'right'
    clientX?: number
    clientY?: number
    cancelable?: boolean
    bubbles?: boolean
  }
  mutableOptions.clientX = (rect.left + rect.right) / 2
  mutableOptions.clientY = (rect.top + rect.bottom) / 2
  mutableOptions.cancelable = true
  mutableOptions.bubbles = true
  let buttonValue: number | 'right' | undefined = options.button
  if (buttonValue === 'right') {
    buttonValue = 2
    mutableOptions.button = 2
  }
  const dispatchOptions = mutableOptions as MouseEventInit
  DispatchEvent.pointerDown(element, dispatchOptions)
  DispatchEvent.mouseDown(element, dispatchOptions)
  if (buttonValue !== 2 /* right */) {
    DispatchEvent.click(element, dispatchOptions)
  }
  DispatchEvent.mouseUp(element, dispatchOptions)
  DispatchEvent.pointerUp(element, dispatchOptions)
  if (buttonValue === 2 /* right */) {
    DispatchEvent.contextMenu(element, dispatchOptions)
  }
}
