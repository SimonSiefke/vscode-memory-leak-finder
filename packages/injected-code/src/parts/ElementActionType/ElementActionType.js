import * as DispatchEvent from '../DispatchEvent/DispatchEvent.js'

export const type = (element, options) => {
  element.value = element.value + options.text
  DispatchEvent.input(element, {})
  DispatchEvent.change(element, {})
}
