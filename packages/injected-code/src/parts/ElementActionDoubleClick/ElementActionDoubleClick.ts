import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'
import * as ElementActionClick from '../ElementActionClick/ElementActionClick.ts'

export const dblclick = (element, options) => {
  ElementActionClick.click(element, options)
  ElementActionClick.click(element, options)
  DispatchEvent.dblclick(element, options)
}
