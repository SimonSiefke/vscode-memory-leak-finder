import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

export const hover = (element: Element, options: MouseEventInit): void => {
  const rect = element.getBoundingClientRect()
  options.clientX = (rect.left + rect.right) / 2
  options.clientY = (rect.top + rect.bottom) / 2
  DispatchEvent.mouseEnter(element, options)
  DispatchEvent.mouseOver(element, options)
  DispatchEvent.mouseMove(element, options)
}
