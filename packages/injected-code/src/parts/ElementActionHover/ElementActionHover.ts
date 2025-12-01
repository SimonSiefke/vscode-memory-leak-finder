import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

export const hover = (element, options) => {
  DispatchEvent.mouseEnter(element, options)
  DispatchEvent.mouseOver(element, options)
}
