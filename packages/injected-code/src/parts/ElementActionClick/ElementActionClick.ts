import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

export const click = (element: Element, options: MouseEventInit & { button?: number | 'right' }) => {
  const rect = element.getBoundingClientRect()
  options.clientX = (rect.left + rect.right) / 2
  options.clientY = (rect.top + rect.bottom) / 2
  options.cancelable = true
  options.bubbles = true
  if (options.button === 'right') {
    options.button = 2 as number
  }
  DispatchEvent.pointerDown(element, options)
  DispatchEvent.mouseDown(element, options)
  if (options.button !== 2 /* right */) {
    DispatchEvent.click(element, options)
  }
  DispatchEvent.mouseUp(element, options)
  DispatchEvent.pointerUp(element, options)
  if (options.button === 2 /* right */) {
    DispatchEvent.contextMenu(element, options)
  }
}
