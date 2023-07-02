import * as Assert from '../Assert/Assert.js'
import * as DispatchEvent from '../DispatchEvent/DispatchEvent.js'
import * as GetKeyCode from '../GetKeyCode/GetKeyCode.js'

export const press = (options, element = document.activeElement) => {
  Assert.object(options)
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
    DispatchEvent.keyDown(element, option)
  }
  for (const option of allOptions) {
    DispatchEvent.keyPress(element, option)
  }
  for (const option of allOptions) {
    DispatchEvent.keyUp(element, option)
  }
}
