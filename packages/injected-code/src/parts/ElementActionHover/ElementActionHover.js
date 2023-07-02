import * as DispatchEvent from '../DispatchEvent/DispatchEvent.js'

export const hover = (element, options) => {
  DispatchEvent.mouseEnter(element, options)
}
