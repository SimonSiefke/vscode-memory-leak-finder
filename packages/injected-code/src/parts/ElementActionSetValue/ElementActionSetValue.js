import * as DispatchEvent from '../DispatchEvent/DispatchEvent.js'

export const setValue = (element, options) => {
  element.value = options.text
  DispatchEvent.input(element, {})
  DispatchEvent.change(element, {})
}
