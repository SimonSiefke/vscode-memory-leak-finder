import * as DispatchEvent from '../DispatchEvent/DispatchEvent.js'

export const click = (element, options) => {
  DispatchEvent.mouseDown(element, options)
  DispatchEvent.click(element, options)
  DispatchEvent.mouseUp(element, options)
  if (options.button === 2 /* right */ || options.button === 'right') {
    DispatchEvent.contextMenu(element, options)
  }
}
