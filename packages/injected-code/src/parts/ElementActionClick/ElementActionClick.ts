import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

export const click = (element: Element, options: MouseEventInit & { button?: number | 'right' }): void => {
  const rect = element.getBoundingClientRect()
  const mutableOptions = options as MouseEventInit & { button?: number | 'right'; clientX?: number; clientY?: number; cancelable?: boolean; bubbles?: boolean }
  mutableOptions.clientX = (rect.left + rect.right) / 2
  mutableOptions.clientY = (rect.top + rect.bottom) / 2
  mutableOptions.cancelable = true
  mutableOptions.bubbles = true
  let buttonValue: number | 'right' | undefined = options.button
  if (buttonValue === 'right') {
    buttonValue = 2
    mutableOptions.button = 2
  }
  DispatchEvent.pointerDown(element, mutableOptions)
  DispatchEvent.mouseDown(element, mutableOptions)
  if (buttonValue !== 2 /* right */) {
    DispatchEvent.click(element, mutableOptions)
  }
  DispatchEvent.mouseUp(element, mutableOptions)
  DispatchEvent.pointerUp(element, mutableOptions)
  if (buttonValue === 2 /* right */) {
    DispatchEvent.contextMenu(element, mutableOptions)
  }
}
