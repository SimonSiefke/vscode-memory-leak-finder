import * as DispatchEvent from '../DispatchEvent/DispatchEvent.ts'

export const setValue = (element, options) => {
  element.value = options.text
  DispatchEvent.input(element, {})
  DispatchEvent.change(element, {})
}
