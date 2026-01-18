import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

export const hover = (element: Element, options: MouseEventInit): void => {
  DispatchEvent.mouseEnter(element, options)
  DispatchEvent.mouseOver(element, options)
}
