import * as DispatchEvent from '../DispatchEvent/DispatchEvent.js'
import * as ElementActionClick from '../ElementActionClick/ElementActionClick.js'

export const dblclick = (element, options) => {
  ElementActionClick.click(element, options)
  ElementActionClick.click(element, options)
  DispatchEvent.dblclick(element, options)
}
