import * as Assert from '../Assert/Assert.js'
import * as ElementActions from '../ElementActions/ElementActions.js'
import * as GetKeyCode from '../GetKeyCode/GetKeyCode.js'

export const press = (options) => {
  Assert.object(options)
  const element = document.activeElement
  const allOptions = [options]
  if (options.ctrlKey) {
    allOptions.unshift({
      ...options,
      key: 'Control',
      keyCode: GetKeyCode.getKeyCode('Control'),
      code: GetKeyCode.getCode('Control'),
    })
  }
  if (options.metaKey) {
    allOptions.unshift({
      ...options,
      key: 'Meta',
      keyCode: GetKeyCode.getKeyCode('Meta'),
      code: GetKeyCode.getKeyCode('Meta'),
    })
  }
  if (options.shiftKey) {
    allOptions.unshift({
      ...options,
      key: 'Shift',
      keyCode: GetKeyCode.getKeyCode('Shift'),
      code: GetKeyCode.getKeyCode('Shift'),
    })
  }
  for (const option of allOptions) {
    ElementActions.keyDown(element, option)
  }
  for (const option of allOptions) {
    ElementActions.keyPress(element, option)
  }
  for (const option of allOptions) {
    ElementActions.keyUp(element, option)
  }
}
