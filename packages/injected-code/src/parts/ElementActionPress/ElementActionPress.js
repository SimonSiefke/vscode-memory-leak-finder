import * as DispatchEvent from '../DispatchEvent/DispatchEvent.js'

export const press = (element, options) => {
  DispatchEvent.keyDown(element, options)
  DispatchEvent.keyPress(element, options)
  DispatchEvent.keyUp(element, options)
}
